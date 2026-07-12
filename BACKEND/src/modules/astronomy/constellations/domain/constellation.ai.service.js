import groq from "../../../../config/groq.js";
import prisma from "../../../../config/db.js";
import { AppError } from "../../../../utils/app.error.util.js";
import { stripJsonFences } from "../../../../utils/ai.response.util.js";
import { withVerifiedConstellationFallback } from "./constellation.fallback.service.js";

export async function getConstellationAIContent(slug, { refresh = false } = {}) {
  const constellation = await findConstellationForAI(slug);
  const constellationWithFallback = withVerifiedConstellationFallback(constellation);

  if (hasCachedAIContent(constellationWithFallback) && !refresh) {
    return buildAIContentResponse(constellationWithFallback, "cache");
  }

  const generated = await generateConstellationAIContent(constellationWithFallback);
  await saveConstellationAIContent(constellation.id, generated);

  return {
    constellationName: constellation.name,
    ...generated,
    source: "groq",
  };
}

const constellationAISelect = {
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
};

async function findConstellationForAI(slug) {
  const constellation = await prisma.constellation.findUnique({
    where: { slug },
    select: constellationAISelect,
  });

  if (!constellation) throw new AppError("Constellation not found", 404);
  return constellation;
}

function hasCachedAIContent(constellation) {
  return Boolean(
    constellation.aiMythology &&
      Array.isArray(constellation.aiFacts) &&
      constellation.aiFacts.length > 0 &&
      constellation.aiObserverTip
  );
}

function buildAIContentResponse(constellation, source) {
  return {
    constellationName: constellation.name,
    mythology: constellation.aiMythology,
    facts: constellation.aiFacts,
    observerTip: constellation.aiObserverTip,
    source,
  };
}

async function generateConstellationAIContent(constellation, language = "English") {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are an astronomy educator. You MUST always respond in ${language}. Always return valid JSON only.`,
      },
      { role: "user", content: buildConstellationPrompt(constellation, language) },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  return parseConstellationContentResponse(response);
}

function buildConstellationPrompt(constellation, language) {
  return `You are an astronomy educator. Generate detailed AI content about the constellation "${constellation.name}".

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
}

function parseConstellationContentResponse(response) {
  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new AppError("Groq returned empty response", 502);

  let result;
  try {
    result = JSON.parse(stripJsonFences(raw));
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

function saveConstellationAIContent(id, generated) {
  return prisma.constellation.update({
    where: { id },
    data: {
      aiMythology: generated.mythology,
      aiFacts: generated.facts,
      aiObserverTip: generated.observerTip,
    },
  });
}
