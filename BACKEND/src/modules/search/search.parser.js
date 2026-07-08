import { includesAny, normalizeSearchText } from "./search-ranking.js";

export const DEFAULT_LIMIT = 6;
export const MAX_LIMIT = 20;
export const SEARCH_TARGETS = ["planets", "constellations", "observatories", "news", "events"];

const MONTHS = [
  ["january", "jan", "thang 1", "thang mot"],
  ["february", "feb", "thang 2", "thang hai"],
  ["march", "mar", "thang 3", "thang ba"],
  ["april", "apr", "thang 4", "thang tu"],
  ["may", "thang 5", "thang nam"],
  ["june", "jun", "thang 6", "thang sau"],
  ["july", "jul", "thang 7", "thang bay"],
  ["august", "aug", "thang 8", "thang tam"],
  ["september", "sep", "thang 9", "thang chin"],
  ["october", "oct", "thang 10", "thang muoi"],
  ["november", "nov", "thang 11", "thang muoi mot"],
  ["december", "dec", "thang 12", "thang muoi hai"],
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_TO_SEASON = {
  12: "Winter",
  1: "Winter",
  2: "Winter",
  3: "Spring",
  4: "Spring",
  5: "Spring",
  6: "Summer",
  7: "Summer",
  8: "Summer",
  9: "Autumn",
  10: "Autumn",
  11: "Autumn",
};

const SEASONS = ["spring", "summer", "autumn", "fall", "winter"];

const STOPWORDS = new Set([
  "a", "an", "and", "are", "at", "best", "by", "can", "co", "cua", "for",
  "from", "gan", "hay", "in", "is", "me", "near", "nearest", "nhung", "of",
  "show", "the", "to", "toi", "trong", "visible", "what", "where", "which",
  "with", "xem", "tim", "la", "nhat", "tot",
]);

const TARGET_KEYWORDS = {
  planets: ["planet", "planets", "hanh tinh", "rings", "moons", "atmosphere", "venus", "mars", "jupiter", "saturn"],
  constellations: ["constellation", "constellations", "chom sao", "zodiac", "orion", "ursa", "scorpius", "visible"],
  observatories: ["observatory", "observatories", "dai quan sat", "stargazing site", "near me", "nearby", "gan toi"],
  news: ["news", "tin tuc", "latest", "nasa", "mission", "spaceflight", "discovery"],
  events: ["event", "events", "meteor", "shower", "eclipse", "comet", "supermoon", "conjunction"],
};

export function parseSearchQuery(rawQuery, params = {}) {
  const normalizedQuery = normalizeSearchText(rawQuery);
  const tokens = tokenize(normalizedQuery);

  return {
    tokens,
    filters: detectFilters(normalizedQuery, params),
    targets: detectTargets(normalizedQuery),
  };
}

function tokenize(normalizedQuery) {
  return normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function detectTargets(normalizedQuery) {
  const targets = Object.entries(TARGET_KEYWORDS)
    .filter(([, keywords]) => includesAny(normalizedQuery, keywords))
    .map(([target]) => target);

  return targets.length > 0 ? targets : SEARCH_TARGETS;
}

function detectFilters(normalizedQuery, params = {}) {
  const lat = params.lat ?? params.latitude;
  const lon = params.lon ?? params.lng ?? params.longitude;

  return {
    hasRings: includesAny(normalizedQuery, ["ring", "rings", "vanh dai"]),
    hasMoons: includesAny(normalizedQuery, ["moon", "moons", "mat trang"]),
    gasGiant: includesAny(normalizedQuery, ["gas giant", "khi khong lo"]),
    rocky: includesAny(normalizedQuery, ["rocky", "terrestrial", "da", "dat da"]),
    nearMe: includesAny(normalizedQuery, ["near me", "nearby", "gan toi", "gan day"]),
    featured: includesAny(normalizedQuery, ["featured", "recommended", "noi bat"]),
    lowLightPollution: includesAny(normalizedQuery, ["dark", "dark sky", "low light", "it anh sang", "light pollution"]),
    latest: includesAny(normalizedQuery, ["latest", "new", "recent", "moi nhat"]),
    month: detectMonth(normalizedQuery),
    season: detectSeason(normalizedQuery),
    lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
    lon: Number.isFinite(Number(lon)) ? Number(lon) : null,
  };
}

function detectMonth(normalizedQuery) {
  for (let i = 0; i < MONTHS.length; i += 1) {
    if (MONTHS[i].some((alias) => normalizedQuery.includes(alias))) {
      return { number: i + 1, name: MONTH_NAMES[i], season: MONTH_TO_SEASON[i + 1] };
    }
  }

  const numericMonth = normalizedQuery.match(/\b(?:month|thang)\s*(1[0-2]|[1-9])\b/);
  if (!numericMonth) return null;

  const number = Number(numericMonth[1]);
  return { number, name: MONTH_NAMES[number - 1], season: MONTH_TO_SEASON[number] };
}

function detectSeason(normalizedQuery) {
  const found = SEASONS.find((season) => normalizedQuery.includes(season));
  if (!found) return null;
  return found === "fall" ? "Autumn" : found[0].toUpperCase() + found.slice(1);
}
