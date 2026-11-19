// Local server for My skin: serves ./public and the AI endpoint POST /api/analyze-skin.
// Run:  npm start   → http://localhost:3000
// The API key is read from .env (ANTHROPIC_API_KEY=...) and never sent to the browser.

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { runSkinAnalysis, validateRequest } from "./lib/analyze-skin.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// .env is re-read on every request, so editing it needs no restart.
function readEnvFile() {
  try { return parseEnv(readFileSync(path.join(here, ".env"), "utf8")); } catch { return {}; }
}
// Key lookup: .env file (local) first, then the host's environment variables (Vercel, etc.).
function getApiKey() {
  const env = readEnvFile();
  // GROQ_API_KEY is the expected name; a Groq key (gsk_…) left under ANTHROPIC_API_KEY in .env is accepted too.
  const fromFile = env.GROQ_API_KEY || (env.ANTHROPIC_API_KEY?.trim().startsWith("gsk_") ? env.ANTHROPIC_API_KEY : "");
  const key = (fromFile || process.env.GROQ_API_KEY || "").trim();
  return key && !key.includes("ضع") && !key.includes("your_key") ? key : null;   // ignore the .env.example placeholders
}
function getModel() {
  return (readEnvFile().GROQ_MODEL || process.env.GROQ_MODEL || "").trim() || undefined;
}

// Locally: http://localhost:3000 on this machine only. On a host (Vercel etc.) use the port it provides.
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.PORT ? undefined : "127.0.0.1";
const PUBLIC_DIR = path.join(here, "public");
const MAX_BODY = 8 * 1024 * 1024;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/api/analyze-skin") return await handleAnalyze(req, res);
    if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { error: "Method not allowed" });
    return await serveStatic(url.pathname, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: "Server error." });
    else res.end();
  }
});

async function handleAnalyze(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const apiKey = getApiKey();
  if (!apiKey) return sendJson(res, 500, { error: "No API key set: add GROQ_API_KEY to .env or to your host's environment variables." });
  const model = getModel();

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return sendJson(res, 413, { error: "The image is too large." });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return sendJson(res, 400, { error: "Invalid request." }); }
  const invalid = validateRequest(body);
  if (invalid) return sendJson(res, 400, { error: invalid });

  res.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" });
  const send = (obj) => { if (!res.writableEnded) res.write(JSON.stringify(obj) + "\n"); };
  console.log(`[analyze-skin] started ${new Date().toLocaleTimeString()}`);
  const t0 = Date.now();
  await runSkinAnalysis({
    apiKey, model, body,
    send: (ev) => { if (ev.type !== "result") console.log(`[analyze-skin] ${ev.type}${ev.n ? " " + ev.n : ""}${ev.message ? ": " + ev.message : ""}`); send(ev); },
  });
  console.log(`[analyze-skin] finished in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  res.end();
}

async function serveStatic(pathname, res) {
  const rel = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return sendJson(res, 403, { error: "Forbidden" });
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

server.listen(PORT, HOST, () => {
  console.log(`My skin is running at http://localhost:${PORT}`);
  console.log(getApiKey() ? "✓ API key found" : "⚠ No API key — add GROQ_API_KEY to .env or your environment variables.");
});
