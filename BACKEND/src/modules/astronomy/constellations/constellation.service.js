// modules/astronomy/constellations/constellation.service.js
import fs from "fs/promises";
import prisma from "../../../config/db.js";
import groq from "../../../config/groq.js";
import { AppError } from "../../../utils/AppError.js";
import { normalizeText } from "../../../utils/normalize.js";
import { similarity } from "../../../utils/fuzzyMatch.js";
import { trackAnalyticsEvent } from "../../../services/analytics/analytics.service.js";

const VISION_MODEL = process.env.GROQ_VISION_MODEL || "";
const MIN_RECOGNITION_CONFIDENCE = Number(process.env.MIN_CONSTELLATION_RECOGNITION_CONFIDENCE || 0.62);

// ─── Groq helper ──────────────────────────────────────────────

/**
 * Gọi Groq để generate AI description cho constellation.
 * Trả về object { mythology, bestViewingMonths, interestingFacts }
 */
async function generateConstellationAIContent(constellation, language = "Vietnamese") {
  const prompt = `You are an astronomy educator. Generate detailed AI content about the constellation "${constellation.name}".

Context about ${constellation.name}:
- Latin Name: ${constellation.latinName || "unknown"}
- Abbreviation: ${constellation.abbreviation || "unknown"}
- Quadrant: ${constellation.quadrant || "unknown"}
- Right Ascension: ${constellation.rightAscension || "unknown"}
- Declination: ${constellation.declination || "unknown"}
- Area (sq degrees): ${constellation.areaSqDeg || "unknown"}
- Main Stars: ${constellation.mainStars || "unknown"}
- Brightest Star: ${constellation.brightestStar || "unknown"}
- Visible Latitudes: ${constellation.visibleLatitudes || "unknown"}
- Best Month to View: ${constellation.bestMonth || "unknown"}
- Family: ${constellation.family || "unknown"}
- Mythological Origin: ${constellation.mythologicalOrigin || "none provided"}

Generate the following in ${language}:
1. A rich mythology story (3-4 sentences).
2. An array of exactly 4 fascinating facts (each 1-2 sentences, no numbering).
3. A short practical observer's tip (2-3 sentences, e.g. how to find it in the sky).

Return ONLY a JSON object in this exact format, no markdown, no extra text:
{
  "mythology": "Story here.",
  "facts": ["Fact 1.", "Fact 2.", "Fact 3.", "Fact 4."],
  "observerTip": "Tip here."
}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are an astronomy educator. You MUST always respond in ${language}. Always return valid JSON only.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new AppError("Groq returned empty response", 502);

  const cleaned = raw.replace(/```json|```/g, "").trim();

  let result;
  try {
    result = JSON.parse(cleaned);
  } catch {
    throw new AppError("Groq response is not valid JSON", 502);
  }

  if (!result.mythology || !Array.isArray(result.facts) || !result.observerTip) {
    throw new AppError("Groq response is missing required fields", 502);
  }

  return {
    mythology: String(result.mythology),
    facts: result.facts.slice(0, 4).map(String),
    observerTip: String(result.observerTip),
  };
}

// ─── Public service functions ─────────────────────────────────

/**
 * Lấy tất cả constellation (tóm tắt cho danh sách).
 */
export async function getAllConstellations({ search, season, quadrant } = {}) {
  const where = { isVisible: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { latinName: { contains: search, mode: "insensitive" } },
      { abbreviation: { contains: search, mode: "insensitive" } },
    ];
  }

  if (season) {
    where.bestSeason = { equals: season, mode: "insensitive" };
  }

  if (quadrant) {
    where.quadrant = { equals: quadrant, mode: "insensitive" };
  }

  return prisma.constellation.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      latinName: true,
      abbreviation: true,
      imageUrl: true,
      brightestStar: true,
      bestMonth: true,
      bestSeason: true,
      quadrant: true,
      family: true,
      areaSqDeg: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Lấy chi tiết một constellation theo slug.
 */
export async function getConstellationBySlug(slug) {
  const constellation = await prisma.constellation.findUnique({
    where: { slug },
  });

  if (!constellation) throw new AppError("Constellation not found", 404);

  return constellation;
}

/**
 * Lấy / generate AI content (mythology, facts, observerTip).
 * Cache trong DB — chỉ gọi Groq khi chưa có hoặc refresh = true.
 */
export async function getConstellationAIContent(slug, { refresh = false } = {}) {
  const constellation = await prisma.constellation.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      latinName: true,
      abbreviation: true,
      quadrant: true,
      rightAscension: true,
      declination: true,
      areaSqDeg: true,
      mainStars: true,
      brightestStar: true,
      visibleLatitudes: true,
      bestMonth: true,
      family: true,
      mythologicalOrigin: true,
      aiFacts: true,
      aiMythology: true,
      aiObserverTip: true,
    },
  });

  if (!constellation) throw new AppError("Constellation not found", 404);

  const hasCache =
    constellation.aiMythology &&
    Array.isArray(constellation.aiFacts) &&
    constellation.aiFacts.length > 0 &&
    constellation.aiObserverTip;

  if (hasCache && !refresh) {
    return {
      constellationName: constellation.name,
      mythology: constellation.aiMythology,
      facts: constellation.aiFacts,
      observerTip: constellation.aiObserverTip,
      source: "cache",
    };
  }

  const generated = await generateConstellationAIContent(constellation);

  await prisma.constellation.update({
    where: { id: constellation.id },
    data: {
      aiMythology: generated.mythology,
      aiFacts: generated.facts,
      aiObserverTip: generated.observerTip,
    },
  });

  return {
    constellationName: constellation.name,
    mythology: generated.mythology,
    facts: generated.facts,
    observerTip: generated.observerTip,
    source: "groq",
  };
}

/**
 * Lấy constellations liên quan cùng family hoặc quadrant,
 * loại trừ bản thân, tối đa 4 kết quả.
 */
export async function getRelatedConstellations(slug) {
  const current = await prisma.constellation.findUnique({
    where: { slug },
    select: { id: true, family: true, quadrant: true },
  });

  if (!current) throw new AppError("Constellation not found", 404);

  // Ưu tiên cùng family, fallback sang cùng quadrant
  const byFamily = current.family
    ? await prisma.constellation.findMany({
        where: {
          isVisible: true,
          family: current.family,
          id: { not: current.id },
        },
        select: { id: true, name: true, slug: true, imageUrl: true, family: true, abbreviation: true },
        take: 4,
      })
    : [];

  if (byFamily.length >= 2) return byFamily;

  // Không đủ → bổ sung từ cùng quadrant
  const excludeIds = [current.id, ...byFamily.map((c) => c.id)];
  const byQuadrant = current.quadrant
    ? await prisma.constellation.findMany({
        where: {
          isVisible: true,
          quadrant: current.quadrant,
          id: { notIn: excludeIds },
        },
        select: { id: true, name: true, slug: true, imageUrl: true, family: true, abbreviation: true },
        take: 4 - byFamily.length,
      })
    : [];

  return [...byFamily, ...byQuadrant];
}

/**
 * Lấy danh sách constellations tốt nhất để quan sát theo tháng hiện tại.
 */
export async function getConstellationsByMonth(month) {
  const monthNum = Number(month);
  if (!monthNum || monthNum < 1 || monthNum > 12) {
    throw new AppError("Invalid month. Must be 1–12.", 400);
  }

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return prisma.constellation.findMany({
    where: {
      isVisible: true,
      bestMonth: { equals: monthNames[monthNum], mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      latinName: true,
      abbreviation: true,
      imageUrl: true,
      brightestStar: true,
      bestSeason: true,
    },
    orderBy: { name: "asc" },
  });
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

export async function recognizeConstellationImage({
  userId,
  file,
  fileUrl,
  hint,
}) {
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
    take: Math.min(Number(limit) || 20, 50),
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
