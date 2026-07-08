import { AppError } from "../../utils/app.error.util.js";
import { clampInteger } from "../../utils/service.util.js";
import { SEARCH_ADAPTERS } from "./search.adapters.js";
import { DEFAULT_LIMIT, MAX_LIMIT, parseSearchQuery } from "./search.parser.js";

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

  return {
    query: rawQuery,
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
