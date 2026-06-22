import prisma from "../../../config/db.js";
import groq from "../../../config/groq.js";
import { AppError } from "../../../utils/AppError.js";

// ─── Groq helper  ──────────────────────────

/**
 * Gọi Groq để generate aiFunFacts cho một hành tinh.
 * Trả về mảng string tối đa 5 facts.
 */
async function generateFunFactsFromGroq(planet,language = "Vietnamese") {
  const prompt = `You are an astronomy educator. Generate exactly 5 fascinating and scientifically accurate fun facts about the planet ${planet.name}.

Context about ${planet.name}:
- Type: ${planet.type}
- Mass: ${planet.massKg ? planet.massKg + " kg" : "unknown"}
- Diameter: ${planet.diameterKm ? planet.diameterKm + " km" : "unknown"}
- Distance from Sun: ${planet.distanceFromSunAu ? planet.distanceFromSunAu + " AU" : "unknown"}
- Average Temperature: ${planet.avgTempCelsius != null ? planet.avgTempCelsius + "°C" : "unknown"}
- Has Rings: ${planet.hasRings}
- Number of Moons: ${planet.numberOfMoons ?? "unknown"}
- Atmosphere: ${planet.atmosphere?.length ? planet.atmosphere.join(", ") : "unknown"}

Rules:
-Response must be in ${language}.
- Each fact must be 1–2 sentences, engaging, and suitable for general audiences.
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
    { 
      role: "user", 
      content: prompt  
    },
  ],
  temperature: 0.7,
  max_tokens: 512,
});

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new AppError("Groq returned empty response", 502);

  // Strip markdown code fences nếu có
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let facts;
  try {
    facts = JSON.parse(cleaned);
  } catch {
    throw new AppError("Groq response is not valid JSON", 502);
  }

  if (!Array.isArray(facts) || facts.length === 0) {
    throw new AppError("Groq response is not a valid facts array", 502);
  }

  // Giới hạn tối đa 5 facts, đảm bảo là string
  return facts.slice(0, 5).map((f) => String(f));
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * Lấy tất cả các hành tinh có isVisible = true,
 * sắp xếp theo khoảng cách từ Mặt Trời tăng dần.
 */
export async function getAllPlanets() {
  return prisma.planet.findMany({
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

/**
 * Lấy thông tin chi tiết của một hành tinh dựa trên slug.
 * Ném ra lỗi 404 nếu không tìm thấy.
 */
export async function getPlanetBySlug(slug) {
  const planet = await prisma.planet.findUnique({ where: { slug } });

  if (!planet) throw new AppError("Planet not found", 404);

  return planet;
}

/**
 * Lấy aiFunFacts của một hành tinh dựa trên slug.
 *
 * Logic:
 * 1. Nếu DB đã có facts → trả về luôn (cache từ DB).
 * 2. Nếu chưa có → gọi Groq generate → lưu vào DB → trả về.
 *
 * Thêm tham số `refresh = true` để bắt buộc generate lại
 * (dùng cho admin route hoặc khi facts bị outdated).
 */
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

  // Trả về cache nếu đã có facts và không yêu cầu refresh
  const hasFacts = Array.isArray(planet.aiFunFacts) && planet.aiFunFacts.length > 0;
  if (hasFacts && !refresh) {
    return {
      planetName: planet.name,
      facts: planet.aiFunFacts,
      source: "cache",
    };
  }

  // Generate từ Groq
  const generatedFacts = await generateFunFactsFromGroq(planet);

  // Lưu vào DB để lần sau không phải gọi Groq lại
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

/**
 * Lấy danh sách hành tinh liên quan dựa trên cùng type,
 * loại trừ hành tinh hiện tại, tối đa 3 kết quả.
 */
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

