import prisma from "../../../config/db.js";
import groq from "../../../config/groq.js";
import { AppError } from "../../../utils/AppError.js";
export {
  getUserConstellationUploads,
  recognizeConstellationImage,
} from "./constellation-recognition.service.js";

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
