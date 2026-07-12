import fs from "fs/promises";
import groq from "../../config/groq.js";
import { createLogger } from "../../utils/logger.util.js";
import { stripJsonFences } from "../../utils/ai.response.util.js";
import { clampUnitInterval } from "../../utils/service.helpers.util.js";
import { MIN_DETECTED_STARS, summarizeStars } from "./constellation.image.analysis.service.js";

const logger = createLogger("constellation-recognition");

const VISUAL_SIGNATURES = {
  orion: "Orion: three nearly straight belt stars in the middle, with bright shoulder/foot stars forming an hourglass.",
  "ursa-major": "Ursa Major: the Big Dipper pattern, a four-star bowl connected to a bent three-star handle.",
  scorpius: "Scorpius: a long curved J-shaped body and hooked tail, often with a bright central star near Antares.",
  aries: "Aries: a compact bent line of a few stars, usually led by Hamal and Sheratan.",
  cancer: "Cancer: a faint Y-shaped or inverted V pattern near the Beehive Cluster.",
  capricornus: "Capricornus: a broad triangular or boat-shaped pattern of relatively faint stars.",
  aquarius: "Aquarius: a large faint water-bearer pattern with a small Y-shaped water jar asterism.",
  gemini: "Gemini: two mostly parallel stick-figure lines starting from two bright twin head stars, Castor and Pollux.",
  leo: "Leo: a sickle or backward question mark head plus a triangular hindquarter.",
  libra: "Libra: a small quadrilateral or scale-like pattern between Virgo and Scorpius.",
  pisces: "Pisces: two fish-like loops or chains of faint stars joined by a cord.",
  sagittarius: "Sagittarius: the Teapot asterism, with handle, lid, spout, and body.",
  cassiopeia: "Cassiopeia: a clear W or M shaped five-star zigzag.",
  taurus: "Taurus: V-shaped Hyades face with bright Aldebaran and nearby compact Pleiades-like cluster.",
  virgo: "Virgo: a long Y or maiden-shaped pattern anchored by the bright star Spica, often drawn as an elongated figure.",
  lyra: "Lyra: very bright Vega with a small parallelogram/ring of nearby stars.",
};

function parseJsonObject(raw = "") {
  const cleaned = stripJsonFences(raw);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace >= firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;
  return JSON.parse(jsonText);
}

export async function runVisionRecognition({ file, candidates, hint, imageAnalysis }) {
  const visionModel = process.env.GROQ_VISION_MODEL || "";
  if (!visionModel) return null;

  const imageBuffer = await fs.readFile(file.path);
  const imageDataUrl = `data:${file.mimetype};base64,${imageBuffer.toString("base64")}`;
  const candidateText = candidates
    .map((item) => `${item.slug}: ${VISUAL_SIGNATURES[item.slug] || item.name}`)
    .join("\n");
  const visualChecks = candidates
    .map((item) => `- ${VISUAL_SIGNATURES[item.slug] || `${item.slug}: identify only if the image contains a distinctive visible star pattern.`}`)
    .join("\n");
  const prompt = `Identify the most likely constellation from the visual star pattern in this uploaded night-sky image.

Known candidates and visual signatures:
${candidateText}

Optional user note: ${hint || "none"}

Backend star detection:
- quality: ${imageAnalysis.quality}
- detected star count: ${imageAnalysis.starCount}
- threshold: ${Math.round(imageAnalysis.threshold)}
- brightest stars:
${summarizeStars(imageAnalysis.stars) || "none"}

Required visual checks:
${visualChecks}

Return only JSON:
{
  "slug": "candidate-slug-or-null",
  "confidence": 0.0,
  "evidence": "name the exact visible asterism or geometric pattern in the image",
  "analysis": "short explanation using visible stars, asterisms, or why no match is safe"
}

Rules:
- Base the answer on the image pixels and detected star centroids.
- The uploaded image may be a real night-sky photo, a constellation map, or an educational illustration with connecting lines.
- Do not infer from filename, user note, candidate order, or mythology.
- Do not choose a famous/default constellation unless its required visual signature is clearly visible.
- Especially do not choose ursa-major unless the image clearly shows the Big Dipper bowl plus handle.
- Especially do not choose scorpius unless the image clearly shows the curved J-shaped scorpion body/tail.
- If fewer than ${MIN_DETECTED_STARS} stars were detected in a real sky photo, lower confidence. If the image is an illustration with visible connecting lines, use the visible constellation outline instead.
- Be conservative: return null if the visible geometry is ambiguous.`;

  try {
    const response = await groq.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "system",
          content: "You are an astronomy image verification assistant. Return valid JSON only and avoid guessing.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 260,
    });

    const parsed = parseJsonObject(response.choices?.[0]?.message?.content || "");
    return {
      slug: parsed.slug || null,
      confidence: clampUnitInterval(parsed.confidence),
      source: "vision",
      evidence: String(parsed.evidence || ""),
      analysis: String(parsed.analysis || "Vision model returned a candidate."),
    };
  } catch (error) {
    logger.error("Vision provider failed", error);
    return null;
  }
}
