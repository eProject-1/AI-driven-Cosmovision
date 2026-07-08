import prisma from "../../../config/db.js";
import groq from "../../../config/groq.js";
import { AppError } from "../../../utils/app-error.util.js";
import { stripJsonFences } from "../../../utils/service.util.js";

export async function getAllPlanets() {
  return prisma.planet.findMany({
    where: { isVisible: true },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      imageUrl: true,
      diameterKm: true,
      distanceFromSunAu: true,
      orbitalPeriodDays: true,
      rotationPeriodHours: true,
      numberOfMoons: true,
      hasRings: true,
    },
    orderBy: { distanceFromSunAu: "asc" },
  });
}

export async function getPlanetBySlug(slug) {
  const planet = await prisma.planet.findUnique({ where: { slug } });
  if (!planet) throw new AppError("Planet not found", 404);
  return planet;
}

export async function getPlanetFacts(slug, { refresh = false } = {}) {
  const planet = await prisma.planet.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      massKg: true,
      diameterKm: true,
      distanceFromSunAu: true,
      avgTempCelsius: true,
      hasRings: true,
      numberOfMoons: true,
      atmosphere: true,
      aiFunFacts: true,
    },
  });

  if (!planet) throw new AppError("Planet not found", 404);

  const hasFacts = Array.isArray(planet.aiFunFacts) && planet.aiFunFacts.length > 0;
  if (hasFacts && !refresh) {
    return {
      planetName: planet.name,
      facts: planet.aiFunFacts,
      source: "cache",
    };
  }

  const generatedFacts = await generateFunFactsFromGroq(planet);
  await prisma.planet.update({
    where: { id: planet.id },
    data: { aiFunFacts: generatedFacts },
  });

  return {
    planetName: planet.name,
    facts: generatedFacts,
    source: "groq",
  };
}

export async function getRelatedPlanets(slug) {
  const currentPlanet = await prisma.planet.findUnique({
    where: { slug },
    select: { id: true, type: true },
  });

  if (!currentPlanet) throw new AppError("Planet not found", 404);

  return prisma.planet.findMany({
    where: {
      isVisible: true,
      type: currentPlanet.type,
      id: { not: currentPlanet.id },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      type: true,
    },
    take: 3,
  });
}

export async function createPlanet(payload) {
  const data = buildPlanetWriteData(payload, { requireBasics: true });
  return prisma.planet.create({ data });
}

export async function updatePlanet(slug, payload) {
  const existing = await prisma.planet.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) throw new AppError("Planet not found", 404);

  return prisma.planet.update({
    where: { id: existing.id },
    data: buildPlanetWriteData(payload),
  });
}

export async function deletePlanet(slug) {
  const existing = await prisma.planet.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) throw new AppError("Planet not found", 404);

  await prisma.planet.update({
    where: { id: existing.id },
    data: { isVisible: false },
  });
  return { slug, deleted: true };
}

async function generateFunFactsFromGroq(planet, language = "English") {
  const prompt = `You are an astronomy educator. Generate exactly 5 fascinating and scientifically accurate fun facts about the planet ${planet.name}.

Context about ${planet.name}:
- Type: ${planet.type}
- Mass: ${planet.massKg ? planet.massKg + " kg" : "unknown"}
- Diameter: ${planet.diameterKm ? planet.diameterKm + " km" : "unknown"}
- Distance from Sun: ${planet.distanceFromSunAu ? planet.distanceFromSunAu + " AU" : "unknown"}
- Average Temperature: ${planet.avgTempCelsius != null ? planet.avgTempCelsius + "C" : "unknown"}
- Has Rings: ${planet.hasRings}
- Number of Moons: ${planet.numberOfMoons ?? "unknown"}
- Atmosphere: ${planet.atmosphere?.length ? planet.atmosphere.join(", ") : "unknown"}

Rules:
- Response must be in ${language}.
- Each fact must be 1-2 sentences, engaging, and suitable for general audiences.
- Do NOT start facts with phrases like "Did you know" or numbering like "1.".
- Return ONLY a JSON array of 5 strings, no markdown, no extra text.

Example format: ["Fact one.", "Fact two.", "Fact three.", "Fact four.", "Fact five."]`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are an astronomy educator. You MUST always respond in ${language}.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 512,
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new AppError("Groq returned empty response", 502);

  let facts;
  try {
    facts = JSON.parse(stripJsonFences(raw));
  } catch {
    throw new AppError("Groq response is not valid JSON", 502);
  }

  if (!Array.isArray(facts) || facts.length === 0) {
    throw new AppError("Groq response is not a valid facts array", 502);
  }

  return facts.slice(0, 5).map(String);
}

const planetWriteFields = [
  "name",
  "slug",
  "type",
  "description",
  "imageUrl",
  "massKg",
  "diameterKm",
  "gravityMs2",
  "distanceFromSunAu",
  "distanceFromEarthKm",
  "orbitalPeriodDays",
  "rotationPeriodHours",
  "avgTempCelsius",
  "atmosphere",
  "numberOfMoons",
  "hasRings",
  "discoveredBy",
  "discoveryYear",
  "aiFunFacts",
  "isVisible",
];

function buildPlanetWriteData(payload = {}, { requireBasics = false } = {}) {
  const data = pickDefined(payload, planetWriteFields);

  if (data.name) data.name = String(data.name).trim();
  if (!data.slug && data.name && requireBasics) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);

  for (const field of [
    "massKg",
    "diameterKm",
    "gravityMs2",
    "distanceFromSunAu",
    "distanceFromEarthKm",
    "orbitalPeriodDays",
    "rotationPeriodHours",
    "avgTempCelsius",
  ]) {
    if (data[field] !== undefined) data[field] = Number(data[field]);
  }

  for (const field of ["numberOfMoons", "discoveryYear"]) {
    if (data[field] !== undefined) data[field] = Number.parseInt(data[field], 10);
  }

  if (data.atmosphere !== undefined && !Array.isArray(data.atmosphere)) data.atmosphere = [];
  if (data.aiFunFacts !== undefined && !Array.isArray(data.aiFunFacts)) data.aiFunFacts = [];

  if (requireBasics && (!data.name || !data.slug || !data.type || !data.description)) {
    throw new AppError("Planet name, type, and description are required.", 400);
  }

  return data;
}

function pickDefined(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
