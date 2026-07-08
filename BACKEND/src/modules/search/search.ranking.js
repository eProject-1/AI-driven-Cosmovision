import { similarity } from "../../utils/fuzzy.match.util.js";
export { calculateDistanceKm } from "../../utils/geo.util.js";

export function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesAny(text, keywords) {
  const normalizedText = normalizeSearchText(text);
  const words = normalizedText.split(/\s+/).filter(Boolean);

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (!normalizedKeyword) return false;
    if (normalizedKeyword.includes(" ")) return normalizedText.includes(normalizedKeyword);
    return words.includes(normalizedKeyword);
  });
}

export function scoreTextMatch(item, tokens, fields) {
  if (!tokens.length) return 0.2;

  const text = normalizeSearchText(
    fields
      .map((field) => {
        const value = item[field];
        return Array.isArray(value) ? value.join(" ") : value;
      })
      .filter(Boolean)
      .join(" ")
  );

  return tokens.reduce((score, token) => {
    if (text.includes(token)) return score + 1;
    const bestWord = text
      .split(/\s+/)
      .reduce((best, word) => Math.max(best, similarity(token, word)), 0);
    return bestWord >= 0.82 ? score + bestWord : score;
  }, 0);
}

export function sortAndLimit(items, limit) {
  return items
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, _matchReasons, ...item }) => ({
      ...item,
      match: {
        score: Number(_score.toFixed(2)),
        reasons: _matchReasons,
      },
    }));
}
