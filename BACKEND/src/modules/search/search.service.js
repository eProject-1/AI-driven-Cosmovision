import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { clampInteger } from "../../utils/service.helpers.util.js";
import { detectResponseLanguage } from "../../services/chatbot/intent.service.js";
import { createChatCompletion } from "../../services/chatbot/llm.service.js";
import { SEARCH_ADAPTERS } from "./search.adapters.js";
import { DEFAULT_LIMIT, MAX_LIMIT, parseSearchQuery } from "./search.parser.js";

const logger = createLogger("search-service");
const SEARCH_AI_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const SEARCH_AI_MAX_TOKENS = 420;

export async function smartSearch({ query, limit = DEFAULT_LIMIT, ...params }) {
  const rawQuery = String(query || params.q || "").trim();
  if (!rawQuery) throw new AppError("Search query is required. Use ?q=show planets with rings", 400);

  const { tokens, filters, targets } = parseSearchQuery(rawQuery, params);
  const safeLimit = clampInteger(filters.requestedLimit || limit, { fallback: DEFAULT_LIMIT, max: MAX_LIMIT });
  const entries = await Promise.all(
    targets.map(async (target) => [
      target,
      await SEARCH_ADAPTERS[target]({ tokens, filters, limit: safeLimit }),
    ])
  );

  const results = Object.fromEntries(entries);
  const flatResults = entries
    .flatMap(([type, items]) => items.map((item) => ({ type, ...item })))
    .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
    .slice(0, filters.requestedLimit || safeLimit * 2);
  const answer = await generateSearchAnswer(rawQuery, flatResults, filters);

  return {
    query: rawQuery,
    answer,
    interpreted: {
      mode: "rule-based-nlp",
      targets,
      tokens,
      filters: {
        ...filters,
        lat: filters.lat,
        lon: filters.lon,
      },
    },
    results,
    flatResults,
    total: entries.reduce((sum, [, items]) => sum + items.length, 0),
  };
}

async function generateSearchAnswer(query, flatResults, filters = {}) {
  try {
    const lang = detectResponseLanguage(query);
    const context = buildSearchAnswerContext(flatResults);
    const languageRule =
      lang === "vi"
        ? "Tra loi bang tieng Viet tu nhien, co dau, ngan gon va de hieu."
        : "Answer in English, concise and easy to understand.";

    const aiAnswer = await createChatCompletion({
      model: SEARCH_AI_MODEL,
      temperature: 0.35,
      maxTokens: SEARCH_AI_MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: `
You are CosmoBot, the astronomy assistant inside CosmoVision search.
${languageRule}
Use the provided search results as context when they are relevant.
If the results do not contain enough information, answer with general astronomy knowledge and say that CosmoVision has no exact matching record.
Do not invent CosmoVision database items, URLs, dates, or live observations.
If multiple search results answer the question, write one short line per result and start each line with the result name.
Return plain text only, concise and easy to scan.
`.trim(),
        },
        {
          role: "user",
          content: `Question: ${query}\n\nSearch result context:\n${context}`,
        },
      ],
    });
    return aiAnswer || buildFallbackSearchAnswer(query, flatResults, filters);
  } catch (error) {
    logger.warn("Search AI answer unavailable", {
      message: error.message,
      statusCode: error.statusCode,
    });
    return buildFallbackSearchAnswer(query, flatResults, filters);
  }
}

function buildFallbackSearchAnswer(query, flatResults = [], filters = {}) {
  const lang = detectResponseLanguage(query);
  const isVi = lang === "vi";

  if (filters.planetMetric) {
    const planets = flatResults.filter((item) => item.type === "planets");
    if (planets.length) {
      return planets
        .map((planet, index) => {
          const measurement = describePlanetMetric(planet, filters.planetMetric);
          return isVi
            ? `${index + 1}. ${planet.name}: ${filters.planetMetric.label}${measurement}. ${planet.description || ""}`.trim()
            : `${index + 1}. ${planet.name}: ${filters.planetMetric.label}${measurement}. ${planet.description || ""}`.trim();
        })
        .join("\n");
    }
  }

  if (filters.month?.name) {
    const constellations = flatResults
      .filter((item) => item.type === "constellations")
      .slice(0, 5)
      .map((item) => item.name);
    if (constellations.length) {
      return isVi
        ? `Trong thang ${filters.month.name}, mot so chom sao phu hop de quan sat la ${joinNames(constellations)}. Ket qua duoc uu tien theo thang/ mua quan sat tot nhat trong du lieu CosmoVision.`
        : `In ${filters.month.name}, good constellation matches include ${joinNames(constellations)}. CosmoVision ranks these by their best observing month or season.`;
    }
  }

  const top = flatResults[0];
  if (top) {
    const title = top.name || top.title || "the top match";
    const summary = top.description || top.summary || top.aiSummary || "It is the strongest CosmoVision match for your search.";
    return isVi ? `${title} la ket qua phu hop nhat. ${summary}` : `${title} is the strongest match. ${summary}`;
  }

  return isVi
    ? "CosmoVision chua tim thay ban ghi trung khop ro rang, nhung ban co the thu tim theo ten hanh tinh, chom sao, dia diem quan sat hoac tin NASA."
    : "CosmoVision did not find an exact record, but you can search by planet, constellation, observatory, NASA news, or sky event.";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function describePlanetMetric(planet, metric) {
  const value = planet[metric.field];
  if (value == null) return "";
  if (metric.field === "diameterKm") return ` at about ${formatNumber(value)} km in diameter`;
  if (metric.field === "avgTempCelsius") return ` at about ${formatNumber(value)}°C average temperature`;
  if (metric.field === "numberOfMoons") return ` with ${formatNumber(value)} known moons`;
  if (metric.field === "distanceFromSunAu") return ` at about ${formatNumber(value)} AU from the Sun`;
  return "";
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function buildSearchAnswerContext(flatResults = []) {
  if (!flatResults.length) return "No matching CosmoVision records were found.";

  return flatResults
    .slice(0, 8)
    .map((item, index) => {
      const title = item.name || item.title || item.slug || `Result ${index + 1}`;
      const summary = item.description || item.summary || item.aiSummary || item.source || item.category || "";
      const details = [
        item.type ? `type: ${item.type}` : null,
        item.match?.reasons?.length ? `matched because: ${item.match.reasons.join(", ")}` : null,
        item.bestMonth ? `best month: ${item.bestMonth}` : null,
        item.bestSeason ? `best season: ${item.bestSeason}` : null,
        item.hasRings != null ? `has rings: ${item.hasRings}` : null,
        item.numberOfMoons != null ? `moons: ${item.numberOfMoons}` : null,
        item.diameterKm != null ? `diameter: ${item.diameterKm} km` : null,
        item.massKg != null ? `mass: ${item.massKg} kg` : null,
        item.publishedAt ? `published: ${item.publishedAt}` : null,
        item.startDate ? `starts: ${item.startDate}` : null,
      ].filter(Boolean);

      return `${index + 1}. ${title}\n${summary}\n${details.join("; ")}`.trim();
    })
    .join("\n\n");
}
