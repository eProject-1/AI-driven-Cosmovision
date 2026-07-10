import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { clampInteger } from "../../utils/service.util.js";
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
  const safeLimit = clampInteger(limit, { fallback: DEFAULT_LIMIT, max: MAX_LIMIT });
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
    .slice(0, safeLimit * 2);
  const answer = await generateSearchAnswer(rawQuery, flatResults);

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

async function generateSearchAnswer(query, flatResults) {
  try {
    const lang = detectResponseLanguage(query);
    const context = buildSearchAnswerContext(flatResults);
    const languageRule =
      lang === "vi"
        ? "Tra loi bang tieng Viet tu nhien, co dau, ngan gon va de hieu."
        : "Answer in English, concise and easy to understand.";

    return await createChatCompletion({
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
Return plain text only, 2 to 4 short sentences.
`.trim(),
        },
        {
          role: "user",
          content: `Question: ${query}\n\nSearch result context:\n${context}`,
        },
      ],
    });
  } catch (error) {
    logger.warn("Search AI answer unavailable", {
      message: error.message,
      statusCode: error.statusCode,
    });
    return null;
  }
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
        item.publishedAt ? `published: ${item.publishedAt}` : null,
        item.startDate ? `starts: ${item.startDate}` : null,
      ].filter(Boolean);

      return `${index + 1}. ${title}\n${summary}\n${details.join("; ")}`.trim();
    })
    .join("\n\n");
}
