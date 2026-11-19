// Optional: only used if the site is later deployed to Netlify.
// For local testing use `npm start` (server.js) — it runs the same logic.
import { runSkinAnalysis, validateRequest } from "../../lib/analyze-skin.js";

export const config = { path: "/api/analyze-skin" };

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json({ error: "Forbidden" }, 403);

  const apiKey = Netlify.env.get("GROQ_API_KEY");
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set on the server." }, 500);
  const model = Netlify.env.get("GROQ_MODEL") || undefined;

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const invalid = validateRequest(body);
  if (invalid) return json({ error: invalid }, 400);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      const ping = setInterval(() => send({ type: "ping" }), 8000);
      await runSkinAnalysis({ apiKey, model, body, send });
      clearInterval(ping);
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
