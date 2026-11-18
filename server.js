// Local server for بشرتي: serves ./public and the AI endpoint POST /api/analyze-skin.
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
function getApiKey() {
  const env = readEnvFile();
  // GROQ_API_KEY is the expected name; a Groq key (gsk_…) left under ANTHROPIC_API_KEY is accepted too.
  const key = (env.GROQ_API_KEY || (env.ANTHROPIC_API_KEY?.trim().startsWith("gsk_") ? env.ANTHROPIC_API_KEY : "") || "").trim();
  return key && !key.includes("ضع") ? key : null;
}

const PORT = 3000;
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
    if (!res.headersSent) sendJson(res, 500, { error: "خطأ في الخادم." });
    else res.end();
  }
});

async function handleAnalyze(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const apiKey = getApiKey();
  if (!apiKey) return sendJson(res, 500, { error: "لم يتم ضبط المفتاح: ضع في ملف ‎.env السطر GROQ_API_KEY=مفتاحك." });
  const model = readEnvFile().GROQ_MODEL?.trim() || undefined;

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return sendJson(res, 413, { error: "حجم الصورة كبير جدًا." });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return sendJson(res, 400, { error: "طلب غير صالح." }); }
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(`بشرتي يعمل على http://localhost:${PORT}`);
  console.log(getApiKey() ? "✓ تم العثور على المفتاح في .env" : "⚠ لا يوجد مفتاح — أنشئ ملف .env من .env.example (لا حاجة لإعادة التشغيل).");
});
