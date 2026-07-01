import fs from "fs/promises";
import prisma from "../../../config/db.js";
import groq from "../../../config/groq.js";
import { AppError } from "../../../utils/AppError.js";
import { normalizeText } from "../../../utils/normalize.js";
import { similarity } from "../../../utils/fuzzyMatch.js";
import { trackAnalyticsEvent } from "../../../services/analytics/analytics.service.js";

const VISION_MODEL = process.env.GROQ_VISION_MODEL || "";
const MIN_RECOGNITION_CONFIDENCE = Number(process.env.MIN_CONSTELLATION_RECOGNITION_CONFIDENCE || 0.62);

function clampLimit(value, fallback = 20, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function parseJsonObject(raw = "") {
  const cleaned = String(raw).replace(/```json|```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace >= firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;
  return JSON.parse(jsonText);
}

async function getRecognitionCandidates() {
  return prisma.constellation.findMany({
    where: { isVisible: true },
    select: {
      id: true,
      name: true,
      slug: true,
      latinName: true,
      abbreviation: true,
      family: true,
      quadrant: true,
      brightestStar: true,
      bestMonth: true,
      bestSeason: true,
    },
    orderBy: { name: "asc" },
  });
}

function scoreCandidateFromText(text, candidate) {
  const normalized = normalizeText(text || "");
  if (!normalized) return 0;

  const aliases = [
    candidate.name,
    candidate.slug,
    candidate.latinName,
    candidate.abbreviation,
    candidate.brightestStar,
  ].filter(Boolean);

  return aliases.reduce((best, alias) => {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) return best;
    if (normalized.includes(normalizedAlias)) return Math.max(best, 0.92);

    const words = normalized.split(/\s+/);
    const aliasWords = normalizedAlias.split(/\s+/);
    const windowSize = aliasWords.length;

    for (let i = 0; i <= words.length - windowSize; i += 1) {
      const phrase = words.slice(i, i + windowSize).join(" ");
      best = Math.max(best, similarity(phrase, normalizedAlias));
    }

    return Math.max(best, similarity(normalized, normalizedAlias) * 0.85);
  }, 0);
}

function getBestLocalMatch({ candidates, hint, fileName }) {
  const sourceText = [hint, fileName].filter(Boolean).join(" ");
  if (!sourceText) return null;

  const scored = candidates
    .map((candidate) => ({
      candidate,
      confidence: scoreCandidateFromText(sourceText, candidate),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const best = scored[0];
  if (!best || best.confidence < 0.55) return null;

  return {
    slug: best.candidate.slug,
    confidence: clampConfidence(best.confidence),
    source: "metadata",
    analysis: hint
      ? "Matched the submitted hint/filename against known constellation aliases."
      : "Matched the uploaded filename against known constellation aliases.",
  };
}

async function runVisionRecognition({ file, candidates, hint }) {
  if (!VISION_MODEL) return null;

  const imageBuffer = await fs.readFile(file.path);
  const imageDataUrl = `data:${file.mimetype};base64,${imageBuffer.toString("base64")}`;
  const candidateText = candidates
    .map((item) => `${item.slug}: ${item.name}${item.latinName ? ` / ${item.latinName}` : ""}${item.abbreviation ? ` (${item.abbreviation})` : ""}`)
    .join("\n");

  const prompt = `Identify the most likely constellation in this uploaded night-sky image.

Choose only from these known candidates:
${candidateText}

Optional user hint: ${hint || "none"}

Return only JSON:
{
  "slug": "candidate-slug-or-null",
  "confidence": 0.0,
  "analysis": "short factual explanation"
}

Use null and a low confidence if the image is unclear, contains no star pattern, or does not match the candidates.`;

  try {
    const response = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an astronomy image recognition assistant. Be conservative and return valid JSON only.",
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
      temperature: 0.1,
      max_tokens: 220,
    });

    const parsed = parseJsonObject(response.choices?.[0]?.message?.content || "");
    return {
      slug: parsed.slug || null,
      confidence: clampConfidence(parsed.confidence),
      source: "vision",
      analysis: String(parsed.analysis || "Vision model returned a candidate."),
    };
  } catch (error) {
    console.error("[constellation-recognition] Vision provider failed:", error.message);
    return null;
  }
}

function resolveRecognizedCandidate(candidates, match) {
  if (!match?.slug) return null;
  return candidates.find((candidate) => candidate.slug === match.slug) || null;
}

function chooseBestRecognition({ visionMatch, localMatch, candidates }) {
  const validVisionCandidate = resolveRecognizedCandidate(candidates, visionMatch);
  const validLocalCandidate = resolveRecognizedCandidate(candidates, localMatch);

  if (validVisionCandidate && visionMatch.confidence >= MIN_RECOGNITION_CONFIDENCE) {
    return { candidate: validVisionCandidate, match: visionMatch };
  }

  if (validLocalCandidate && localMatch.confidence >= MIN_RECOGNITION_CONFIDENCE) {
    return { candidate: validLocalCandidate, match: localMatch };
  }

  if (validVisionCandidate && !validLocalCandidate) {
    return { candidate: null, match: visionMatch };
  }

  if (validLocalCandidate && !validVisionCandidate) {
    return { candidate: null, match: localMatch };
  }

  return {
    candidate: null,
    match: {
      slug: null,
      confidence: 0,
      source: VISION_MODEL ? "vision" : "metadata",
      analysis: VISION_MODEL
        ? "No confident constellation match was found."
        : "No vision model is configured. Set GROQ_VISION_MODEL to enable image-based recognition.",
    },
  };
}

async function removeUploadedFileSafely(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("[constellation-recognition] Failed to cleanup uploaded file:", error.message);
    }
  }
}

export async function recognizeConstellationImage({ userId, file, fileUrl, hint }) {
  if (!userId) throw new AppError("User authentication is required.", 401);
  if (!file) throw new AppError("Image file is required. Use multipart/form-data field name 'image'.", 400);

  let upload;
  try {
    upload = await prisma.imageUpload.create({
      data: {
        userId,
        originalUrl: fileUrl,
        fileName: file.originalname || file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        isProcessed: false,
      },
    });
  } catch (error) {
    await removeUploadedFileSafely(file.path);
    throw error;
  }

  const candidates = await getRecognitionCandidates();
  const localMatch = getBestLocalMatch({
    candidates,
    hint,
    fileName: file.originalname || file.filename,
  });
  const visionMatch = await runVisionRecognition({ file, candidates, hint });
  const { candidate, match } = chooseBestRecognition({ visionMatch, localMatch, candidates });

  const confidence = clampConfidence(match?.confidence);
  const isConfident = Boolean(candidate && confidence >= MIN_RECOGNITION_CONFIDENCE);
  const aiAnalysis = [
    match?.analysis,
    visionMatch ? `Vision source confidence: ${visionMatch.confidence}.` : null,
    localMatch ? `Metadata source confidence: ${localMatch.confidence}.` : null,
  ].filter(Boolean).join(" ");

  const updatedUpload = await prisma.imageUpload.update({
    where: { id: upload.id },
    data: {
      isProcessed: true,
      recognizedConstellation: isConfident ? candidate.name : null,
      constellationId: isConfident ? candidate.id : null,
      confidenceScore: confidence,
      aiAnalysis,
      processedAt: new Date(),
    },
    include: {
      constellation: {
        select: {
          id: true,
          name: true,
          slug: true,
          latinName: true,
          abbreviation: true,
          imageUrl: true,
          mapUrl: true,
          bestMonth: true,
          bestSeason: true,
        },
      },
    },
  });

  trackAnalyticsEvent({
    userId,
    event: "IMAGE_UPLOAD",
    entityType: "constellation",
    entityId: updatedUpload.constellationId,
    entityName: updatedUpload.recognizedConstellation || "Unrecognized constellation image",
    metadata: {
      uploadId: updatedUpload.id,
      confidenceScore: updatedUpload.confidenceScore,
      fileSize: updatedUpload.fileSize,
      mimeType: updatedUpload.mimeType,
      recognized: isConfident,
    },
  }).catch((error) => console.error("[analytics] image upload track failed:", error.message));

  return {
    upload: updatedUpload,
    recognition: {
      status: isConfident ? "RECOGNIZED" : "UNRECOGNIZED",
      confidence,
      threshold: MIN_RECOGNITION_CONFIDENCE,
      source: match?.source || "unknown",
      constellation: updatedUpload.constellation,
      analysis: aiAnalysis,
    },
  };
}

export async function getUserConstellationUploads(userId, { limit = 20 } = {}) {
  if (!userId) throw new AppError("User authentication is required.", 401);

  return prisma.imageUpload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: clampLimit(limit),
    include: {
      constellation: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          mapUrl: true,
        },
      },
    },
  });
}
