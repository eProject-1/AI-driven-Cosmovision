import fs from "fs/promises";
import path from "path";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { clampInteger, clampUnitInterval, requireUserId } from "../../utils/service.util.js";
import { trackAnalyticsEvent } from "../analytics/analytics.service.js";
import { analyzeStarField } from "./constellation.image.analysis.service.js";
import { runClipRecognition } from "./constellation.clip.recognition.service.js";
import { runVisionRecognition } from "./constellation.vision.recognition.service.js";

const MIN_RECOGNITION_CONFIDENCE = Number(process.env.MIN_CONSTELLATION_RECOGNITION_CONFIDENCE || 0.62);
const MIN_AI_RECOGNITION_CONFIDENCE = Number(process.env.MIN_AI_CONSTELLATION_RECOGNITION_CONFIDENCE || 0.76);
const MIN_CLIP_RECOGNITION_CONFIDENCE = Number(process.env.MIN_CLIP_CONSTELLATION_RECOGNITION_CONFIDENCE || 0.28);
const MIN_CLIP_RECOGNITION_MARGIN = Number(process.env.MIN_CLIP_CONSTELLATION_RECOGNITION_MARGIN || 0.03);
const CONSTELLATION_UPLOAD_DIR = path.join(process.cwd(), "src", "uploads", "constellations");
const logger = createLogger("constellation-recognition");
const VISUAL_EVIDENCE_TERMS = {
  orion: ["belt", "three", "hourglass", "shoulder", "foot"],
  "ursa-major": ["big dipper", "dipper", "bowl", "handle", "seven"],
  scorpius: ["scorpius", "scorpion", "curved", "hook", "tail", "j shaped", "antares"],
  aries: ["aries", "hamal", "sheratan", "bent"],
  cancer: ["cancer", "beehive", "y shaped", "inverted v"],
  capricornus: ["capricornus", "capricorn", "triangle", "boat"],
  aquarius: ["aquarius", "water", "jar", "y shaped"],
  gemini: ["twin", "parallel", "castor", "pollux"],
  leo: ["sickle", "question mark", "triangle"],
  libra: ["libra", "scale", "scales", "quadrilateral"],
  pisces: ["pisces", "fish", "loop", "chain", "cord"],
  sagittarius: ["sagittarius", "teapot", "spout", "handle", "lid"],
  cassiopeia: ["w shaped", "m shaped", "zigzag", "zig zag"],
  taurus: ["v shaped", "hyades", "aldebaran", "pleiades"],
  virgo: ["virgo", "spica", "maiden", "y shaped", "elongated"],
  lyra: ["vega", "parallelogram", "lyre"],
};

function getRecognitionThreshold(source) {
  if (source === "clip") return MIN_CLIP_RECOGNITION_CONFIDENCE;
  if (source === "vision") return Math.max(MIN_RECOGNITION_CONFIDENCE, MIN_AI_RECOGNITION_CONFIDENCE);
  return MIN_RECOGNITION_CONFIDENCE;
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

function resolveRecognizedCandidate(candidates, match) {
  if (!match?.slug) return null;
  return candidates.find((candidate) => candidate.slug === match.slug) || null;
}

function hasVisualEvidence(match) {
  if (!match?.slug) return false;
  const terms = VISUAL_EVIDENCE_TERMS[match.slug];
  if (!terms) return true;

  const text = `${match.evidence || ""} ${match.analysis || ""}`.toLowerCase();
  return terms.some((term) => text.includes(term));
}

function isClipMatchAcceptable(clipMatch) {
  if (!clipMatch?.slug) return false;
  const confidence = clampUnitInterval(clipMatch.confidence);
  const secondBestConfidence = clampUnitInterval(clipMatch.top?.[1]?.confidence);
  return confidence >= MIN_CLIP_RECOGNITION_CONFIDENCE ||
    confidence - secondBestConfidence >= MIN_CLIP_RECOGNITION_MARGIN;
}

function chooseRecognition({ clipMatch, visionMatch, candidates }) {
  const clipCandidate = resolveRecognizedCandidate(candidates, clipMatch);
  const visionCandidate = resolveRecognizedCandidate(candidates, visionMatch);

  if (clipCandidate) {
    const clipConfidence = clampUnitInterval(clipMatch.confidence);
    const secondBestConfidence = clampUnitInterval(clipMatch.top?.[1]?.confidence);
    const clipMargin = clipConfidence - secondBestConfidence;
    const visionAgreementBoost =
      visionCandidate?.slug === clipCandidate.slug && visionMatch?.confidence >= MIN_RECOGNITION_CONFIDENCE
        ? 0.08
        : 0;
    const confidence = clampUnitInterval(clipConfidence + visionAgreementBoost);

    if (isClipMatchAcceptable(clipMatch)) {
      return {
        candidate: clipCandidate,
        match: {
          slug: clipCandidate.slug,
          confidence,
          source: "clip",
          accepted: true,
          analysis: [
            clipMatch.analysis,
            visionAgreementBoost
              ? `Vision model agreed with CLIP on ${clipCandidate.slug}, so confidence was increased.`
              : null,
            clipMargin >= MIN_CLIP_RECOGNITION_MARGIN
              ? `CLIP top match margin was ${clipMargin.toFixed(3)}.`
              : null,
          ].filter(Boolean).join(" "),
        },
      };
    }
  }

  if (visionCandidate) {
    const evidencePenalty = hasVisualEvidence(visionMatch) ? 0 : 0.45;
    const confidence = clampUnitInterval(visionMatch.confidence - evidencePenalty);
    const threshold = Math.max(MIN_RECOGNITION_CONFIDENCE, MIN_AI_RECOGNITION_CONFIDENCE);
    return {
      candidate: confidence >= threshold ? visionCandidate : null,
      match: {
        slug: visionCandidate.slug,
        confidence,
        source: "vision",
        accepted: confidence >= threshold,
        analysis: [
          visionMatch.analysis,
          evidencePenalty
            ? `The AI did not provide required visual evidence for ${visionCandidate.slug}, so confidence was reduced.`
            : null,
        ].filter(Boolean).join(" "),
      },
    };
  }

  return {
    candidate: null,
    match: {
      slug: null,
      confidence: 0,
      source: "vision",
      accepted: false,
      analysis: "No confident AI image recognition match was found.",
    },
  };
}

async function removeUploadedFileSafely(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.error("Failed to cleanup uploaded file", error);
    }
  }
}

function getConstellationUploadPathFromUrl(originalUrl) {
  if (!originalUrl) return null;

  try {
    const urlPath = new URL(originalUrl).pathname;
    const marker = "/uploads/constellations/";
    if (!urlPath.includes(marker)) return null;

    const fileName = path.basename(decodeURIComponent(urlPath));
    if (!fileName || fileName === "." || fileName === "..") return null;
    return path.join(CONSTELLATION_UPLOAD_DIR, fileName);
  } catch {
    return null;
  }
}

export async function recognizeConstellationImage({ userId, file, fileUrl, hint }) {
  requireUserId(userId, "User authentication is required.");
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
  const imageAnalysis = await analyzeStarField(file);
  const clipMatch = await runClipRecognition({ file });
  const visionMatch = isClipMatchAcceptable(clipMatch)
    ? null
    : await runVisionRecognition({
      file,
      candidates,
      hint,
      imageAnalysis,
    });
  const { candidate, match } = chooseRecognition({
    clipMatch,
    visionMatch,
    candidates,
  });

  const confidence = clampUnitInterval(match?.confidence);
  const recognitionThreshold = getRecognitionThreshold(match?.source);
  const isConfident = Boolean(candidate && (match?.accepted || confidence >= recognitionThreshold));
  const aiAnalysis = [
    `Star detection: ${imageAnalysis.starCount} star-like points (${imageAnalysis.quality}).`,
    match?.analysis,
    clipMatch ? `CLIP: ${clipMatch.slug || "none"} (${clipMatch.confidence}).` : "CLIP: unavailable or not trained.",
    visionMatch?.evidence ? `Evidence: ${visionMatch.evidence}.` : null,
    visionMatch ? `Vision: ${visionMatch.slug || "none"} (${visionMatch.confidence}).` : "Vision: unavailable.",
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
      detectedStars: imageAnalysis.starCount,
      rawComponents: imageAnalysis.rawComponentCount,
      rejectedComponents: imageAnalysis.rejectedComponents,
      clipSlug: clipMatch?.slug || null,
      clipConfidence: clipMatch?.confidence || null,
      clipTop: clipMatch?.top || null,
      visionSlug: visionMatch?.slug || null,
      visionConfidence: visionMatch?.confidence || null,
      visionEvidence: visionMatch?.evidence || null,
      source: match?.source || "unknown",
    },
  }).catch((error) => logger.error("Image upload analytics tracking failed", error));

  return {
    upload: updatedUpload,
    recognition: {
      status: isConfident ? "RECOGNIZED" : "UNRECOGNIZED",
      confidence,
      threshold: recognitionThreshold,
      source: match?.source || "vision",
      constellation: updatedUpload.constellation,
      analysis: aiAnalysis,
      diagnostics: {
        detectedStars: imageAnalysis.starCount,
        rawComponents: imageAnalysis.rawComponentCount,
        rejectedComponents: imageAnalysis.rejectedComponents,
        imageQuality: imageAnalysis.quality,
        clip: clipMatch ? {
          slug: clipMatch.slug,
          confidence: clipMatch.confidence,
          top: clipMatch.top || [],
        } : null,
        vision: visionMatch ? {
          slug: visionMatch.slug,
          confidence: visionMatch.confidence,
          evidence: visionMatch.evidence,
          hasRequiredEvidence: hasVisualEvidence(visionMatch),
        } : null,
      },
    },
  };
}

export async function getUserConstellationUploads(userId, { limit = 20 } = {}) {
  requireUserId(userId, "User authentication is required.");

  return prisma.imageUpload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: clampInteger(limit, { fallback: 20 }),
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

export async function deleteUserConstellationUpload(userId, uploadId) {
  requireUserId(userId, "User authentication is required.");
  if (!uploadId) throw new AppError("Upload id is required.", 400);

  const upload = await prisma.imageUpload.findFirst({
    where: { id: uploadId, userId },
    select: { id: true, originalUrl: true },
  });

  if (!upload) throw new AppError("Scan history item not found.", 404);

  await prisma.imageUpload.delete({ where: { id: upload.id } });

  const uploadedFilePath = getConstellationUploadPathFromUrl(upload.originalUrl);
  await removeUploadedFileSafely(uploadedFilePath);

  return { id: upload.id };
}
