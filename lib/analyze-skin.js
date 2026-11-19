// My skin — pore analysis core (Groq vision models), shared by the local
// server (server.js) and the optional Netlify edge function.
//
// Flow: one face photo + the user's profile (medical file, skin type) →
// 3 independent vision analyses → 1 synthesis call that merges them into the
// final report. Progress is reported through `send(event)` so the loading
// screen can show real steps.

import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Vision-capable Groq model (see console.groq.com/docs/vision). Override with GROQ_MODEL in .env.
const DEFAULT_MODELS = ["qwen/qwen3.8-27b"];
// Qwen thinking is kept short and hidden: we only want the JSON answer, and tokens are limited.
const REASONING = { analysis: "low", synthesis: "none" };
// 1 = one request that writes the report directly. 3 = three independent analyses + one merge request.
const RUNS = 1;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Groq limit for base64 images

/* ------------------------------------------------------------------ */
/* Schemas (lenient: a bad field falls back instead of failing)        */
/* ------------------------------------------------------------------ */

const Level = z.enum(["low", "moderate", "high"]).catch("moderate");
const Zone = z.enum(["forehead", "nose", "cheeks", "chin"]);
const str = z.string().catch("");

const AnalysisSchema = z.object({
  image_ok: z.boolean().catch(true),
  image_issue: str,
  lighting_caveat: str,
  pore_size: z.enum(["fine", "medium", "large", "mixed"]).catch("medium"),
  pore_pattern: str,
  oiliness: Level,
  zones: z.array(z.object({
    zone: Zone,
    pore_visibility: z.enum(["fine", "visible", "enlarged"]).catch("visible"),
    congestion: z.enum(["none", "some", "marked"]).catch("some"),
    shine: Level,
    observation: str,
  })).catch([]),
  other_findings: z.array(z.object({ finding: str, severity: z.enum(["mild", "moderate", "marked"]).catch("mild") })).catch([]),
  confidence: Level,
});

const ReportSchema = z.object({
  image_ok: z.boolean().catch(true),
  image_issue: str,
  summary: z.string().min(1),
  pore_type: z.string().min(1),
  pore_type_explainer: str,
  oiliness: Level,
  zones: z.array(z.object({
    zone: Zone,
    status: z.enum(["good", "watch", "concern"]).catch("watch"),
    note: str,
  })).catch([]),
  key_findings: z.array(z.string()).catch([]),
  routine: z.array(z.object({ step: z.string(), why: str })).catch([]),
  ingredients_seek: z.array(z.string()).catch([]),
  ingredients_avoid: z.array(z.string()).catch([]),
  see_doctor: z.boolean().catch(false),
  doctor_reason: str,
  agreement: z.enum(["high", "medium", "low"]).catch("medium"),
  confidence_note: str,
});

/* ------------------------------------------------------------------ */
/* Prompts                                                             */
/* ------------------------------------------------------------------ */

const ANALYSIS_SHAPE = `{
  "image_ok": true,                       // false if the face/skin is not clear enough to judge pores
  "image_issue": "",                      // English, only when image_ok=false: what is wrong (blur, distance, filter, makeup, dark)
  "lighting_caveat": "",                  // English, how lighting/camera may bias the read, or ""
  "pore_size": "fine|medium|large|mixed",
  "pore_pattern": "",                     // English, max 12 words: where pores are most visible and their shape
  "oiliness": "low|moderate|high",
  "zones": [                              // exactly 4 items: forehead, nose, cheeks, chin
    {"zone": "forehead|nose|cheeks|chin", "pore_visibility": "fine|visible|enlarged",
     "congestion": "none|some|marked", "shine": "low|moderate|high", "observation": ""}  // observation: Arabic, max 12 words
  ],
  "other_findings": [{"finding": "", "severity": "mild|moderate|marked"}],               // English findings, 0–4 items
  "confidence": "low|moderate|high"
}`;

const REPORT_SHAPE = `{
  "image_ok": true,
  "image_issue": "",               // English, only when image_ok=false: exactly how to retake the photo
  "summary": "",                   // English, 1–2 sentences addressed to the user
  "pore_type": "",                 // English label, e.g. "Enlarged pores in the T-zone, fine on the cheeks"
  "pore_type_explainer": "",       // English, one sentence on what likely drives it for THIS user
  "oiliness": "low|moderate|high",
  "zones": [{"zone": "forehead|nose|cheeks|chin", "status": "good|watch|concern", "note": ""}],  // 4 items, note max 12 words
  "key_findings": [""],            // English, 2–4 items, each max 14 words
  "routine": [{"step": "", "why": ""}],  // 3–5 steps; step = action + ingredient + frequency; why max 10 words
  "ingredients_seek": [""],        // English ingredient names, 2–4
  "ingredients_avoid": [""],       // English ingredient names, 0–4, only if relevant to this user
  "see_doctor": false,
  "doctor_reason": "",             // English, "" if see_doctor=false
  "agreement": "high|medium|low",  // how consistent the analyses were
  "confidence_note": ""            // English, one short sentence on reliability
}`;

const JSON_RULES = `Output rules: reply with ONE JSON object only, no markdown, no comments. Enum fields must use exactly one of the English values shown. All free-text values in clear, plain English.`;

const LOOKING_GUIDE = `How to look at the photo:
- Inspect four zones separately: forehead, nose (incl. sides of the nose), cheeks (inner cheek near the nose vs. outer cheek), chin.
- Pore size: "fine" = barely visible at normal viewing distance; "visible" = clearly seen as dots; "enlarged" = wide openings, sometimes elongated/teardrop-shaped (often a sign of laxity) or orange-peel texture.
- Congestion: blackheads (dark plugs), sebaceous filaments (grey/beige dots on the nose, normal and not blackheads), closed comedones (small skin-coloured bumps).
- Shine: specular highlights that follow the T-zone suggest sebum; a uniform sheen over the whole face may be moisturiser, sweat or flash.
- Separate real skin features from artefacts: camera noise, compression, beauty filters (unnaturally smooth skin), makeup, harsh flash, low light, shadows. If an artefact limits what you can say, say so in lighting_caveat and lower confidence.
- If the face is not visible, too far, too blurred, heavily filtered or the photo is not of a face, set image_ok=false and explain what to change. Do not guess in that case.

Use the user's profile only to INTERPRET what you see (e.g. age and pore laxity, oily skin and T-zone shine, isotretinoin and dryness), never to invent findings that are not visible.
You are not diagnosing disease. Do not name medical conditions from the photo; describe visual signs only.`;

const ANALYST_SYSTEM = `You are a cosmetic skin-analysis specialist working inside "My skin", a skincare app. You assess facial PORES from one user photo, the way an experienced esthetician would during an in-person consultation, and report what is visibly there.

${LOOKING_GUIDE} Short and concrete, no filler, no generic advice.

Return JSON with this shape:
${ANALYSIS_SHAPE}

${JSON_RULES}`;

function writingRules(gender) {
  const voice = "Address the user directly as \"you\".";
  return `Zones: "good" = fine pores and no congestion; "watch" = visible pores or mild congestion/shine; "concern" = enlarged pores or marked congestion.

Writing rules:
- ${voice}
- Warm but precise. Every sentence must carry information specific to this user's photo or profile. No filler, no greetings, no disclaimers inside fields, no repeating the same point twice.
- Routine: 3–5 concrete steps that target what was seen (e.g. "2% salicylic acid cleanser in the evening, 3 times a week" rather than "use a suitable cleanser").
- Safety: if the profile mentions pregnancy or breastfeeding, never recommend retinoids or hydroquinone, and list them in ingredients_avoid. If the user has a known skin allergy or sensitive skin, avoid fragrance and strong acids. If the profile lists eczema, psoriasis, rosacea or hormonal acne WITHOUT current medical supervision, or the skin shows marked inflammation, set see_doctor=true with a one-line reason.
- Products: name ingredient types, not brands.

Return JSON with this shape:
${REPORT_SHAPE}

${JSON_RULES}`;
}

// Single-request mode: look at the photo and write the final report in one go.
function singleSystem(gender) {
  return `You are "My skin", the personal skincare assistant of the My skin app. You assess the user's facial PORES from one photo, the way an experienced esthetician would during an in-person consultation, and write their report.

${LOOKING_GUIDE}
In the report, "agreement" describes how sure you are of the overall read (high / medium / low).

${writingRules(gender)}`;
}

function synthSystem(gender) {
  return `You are "My skin", the personal skincare assistant of the My skin app. You receive ${RUNS} independent pore analyses of the SAME photo, plus the user's profile, and you write the final report.

Merging rules:
- Trust findings that appear in most analyses. If the analyses disagree, choose the more conservative reading and lower "agreement".
- If most analyses say the image is unusable, set image_ok=false, explain in image_issue exactly how to retake the photo, and keep the other fields minimal.

${writingRules(gender)}`;
}

function profileBlock(profile) {
  const m = profile?.medical || null;
  const s = profile?.skinType || null;
  const lines = [];
  if (m) {
    lines.push(`gender: ${m.gender === "male" ? "male" : "female"}`);
    if (m.age) lines.push(`age: ${m.age}`);
    lines.push(`conditions: ${(m.conditions || []).join(", ") || "none reported"}`);
    if (m.risky?.length) lines.push(`under medical supervision for ${m.risky.join(", ")}: ${m.supervised === true ? "yes" : m.supervised === false ? "no" : "unknown"}`);
    if (m.meds) lines.push(`current medications: ${m.meds}`);
    if (m.allergies) lines.push(`known ingredient allergies: ${m.allergies}`);
    if (m.sun) lines.push(`sun exposure: ${m.sun}`);
  } else {
    lines.push("medical profile: not completed");
  }
  lines.push(s ? `self-reported skin type (quiz): ${s.raw} (${s.label})` : "skin type quiz: not completed");
  return `<user_profile>\n${lines.join("\n")}\n</user_profile>`;
}

/* ------------------------------------------------------------------ */
/* Groq client                                                         */
/* ------------------------------------------------------------------ */

class GroqError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

async function groqJSON({ apiKey, models, system, userContent, schema, temperature, reasoning }) {
  let lastErr;
  for (const model of models) {
    // up to 2 attempts per model: a rate-limit wait, or one retry when the JSON doesn't validate
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, { role: "user", content: userContent }],
            response_format: { type: "json_object" },
            temperature: attempt ? 0.2 : temperature,
            max_completion_tokens: 4096,
            ...(model.startsWith("qwen/") ? { reasoning_effort: reasoning, reasoning_format: "hidden" } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const code = data?.error?.code || data?.error?.type || "";
          const err = new GroqError(res.status, code, data?.error?.message || `HTTP ${res.status}`);
          if (res.status === 429 && attempt === 0) {
            const wait = Math.min(15, Number(res.headers.get("retry-after")) || 5);
            await new Promise((r) => setTimeout(r, wait * 1000));
            lastErr = err; continue;
          }
          throw err;
        }
        const text = data?.choices?.[0]?.message?.content || "";
        const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
        const parsed = schema.safeParse(JSON.parse(cleaned));
        if (!parsed.success) throw new GroqError(0, "invalid_json", "Response did not match the schema");
        return parsed.data;
      } catch (err) {
        lastErr = err;
        if (err instanceof SyntaxError || err.code === "invalid_json") continue; // retry same model
        if (err instanceof GroqError && (err.status === 404 || err.code === "model_not_found" || err.code === "model_decommissioned")) break; // try next model
        throw err;
      }
    }
  }
  throw lastErr || new Error("no_output");
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

// Returns an error message if the request body is invalid, otherwise null.
export function validateRequest(body) {
  const { image, mediaType } = body || {};
  if (typeof image !== "string" || !["image/jpeg", "image/png", "image/webp"].includes(mediaType)) return "Invalid image.";
  if (image.length > MAX_IMAGE_BYTES) return "The image is too large.";
  return null;
}

// Runs the full analysis and reports progress through send(): start → analysis ×3 → synthesizing → result | error.
export async function runSkinAnalysis({ apiKey, model, body, send }) {
  const { image, mediaType, profile } = body;
  const models = [...new Set([model, ...DEFAULT_MODELS].filter(Boolean))];
  const imagePart = { type: "image_url", image_url: { url: `data:${mediaType};base64,${image}` } };
  try {
    send({ type: "start", runs: RUNS });

    if (RUNS === 1) {
      const report = await groqJSON({
        apiKey, models, system: singleSystem(profile?.medical?.gender), schema: ReportSchema, temperature: 0.4, reasoning: REASONING.analysis,
        userContent: [
          { type: "text", text: `${profileBlock(profile)}\n\nAnalyse the pores in this photo and write my report as JSON. Report only what is visible.` },
          imagePart,
        ],
      });
      send({ type: "result", report, runs: 1 });
      return;
    }

    // 3 independent analyses, one after another (gentler on Groq rate limits).
    const analyses = [];
    let lastErr = null;
    for (let i = 0; i < RUNS; i++) {
      try {
        analyses.push(await groqJSON({
          apiKey, models, system: ANALYST_SYSTEM, schema: AnalysisSchema, temperature: 0.6, reasoning: REASONING.analysis,
          userContent: [
            { type: "text", text: `${profileBlock(profile)}\n\nAnalyse the pores in this photo following your instructions. Report only what is visible. Reply in JSON.` },
            imagePart,
          ],
        }));
        send({ type: "analysis", n: analyses.length, of: RUNS });
      } catch (err) {
        // a bad key, a missing model or a rate limit will fail the same way again — stop now and say why
        if (err instanceof GroqError && (err.status === 401 || err.status === 403 || err.status === 404 || err.status === 429 ||
            err.code === "model_not_found" || err.code === "model_decommissioned")) throw err;
        console.error(`analysis ${i + 1} failed:`, err.status || "", err.code || "", err.message);
        lastErr = err;
      }
    }
    if (analyses.length < 2) throw lastErr || new Error("analysis_failed");

    send({ type: "synthesizing" });
    const report = await groqJSON({
      apiKey, models, system: synthSystem(profile?.medical?.gender), schema: ReportSchema, temperature: 0.3, reasoning: REASONING.synthesis,
      userContent: [
        {
          type: "text",
          text: `${profileBlock(profile)}\n\n${analyses.map((a, i) =>
            `<analysis index="${i + 1}">\n${JSON.stringify(a)}\n</analysis>`).join("\n")}\n\nWrite the final report for this user as JSON. The photo is attached for reference.`,
        },
        imagePart,
      ],
    });

    send({ type: "result", report, runs: analyses.length });
  } catch (err) {
    send({ type: "error", message: errorMessage(err) });
  }
}

function errorMessage(err) {
  console.error("analyze-skin error:", err.status || "", err.code || "", err.message);
  if (err instanceof GroqError) {
    if (err.status === 401) return "The Groq key is invalid. Check GROQ_API_KEY in .env.";
    if (err.status === 403) return "The Groq key has no access to this model.";
    if (err.status === 404 || err.code === "model_not_found" || err.code === "model_decommissioned")
      return "The selected Groq model is unavailable. Set a vision-capable model in GROQ_MODEL in .env.";
    if (err.status === 429) return "Groq rate limit reached — wait a minute and try again.";
    if (err.status === 413) return "The image is too large for Groq.";
    if (err.status === 400) return "Groq rejected the request — try another photo as JPG.";
    if (err.code === "invalid_json") return "The model did not return a valid result, please try again.";
    return "The Groq service returned an error, please try again.";
  }
  if (err?.message === "analysis_failed") return "Could not complete the analyses — try a clearer photo.";
  return "Could not reach the AI service.";
}
