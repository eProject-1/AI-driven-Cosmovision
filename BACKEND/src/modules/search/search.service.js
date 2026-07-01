import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { similarity } from "../../utils/fuzzyMatch.js";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

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

const NEWS_DISCOVERY_TOKENS = new Set([
  "news", "latest", "new", "recent", "tin", "tuc", "moi",
]);

const TARGET_KEYWORDS = {
  planets: ["planet", "planets", "hanh tinh", "rings", "moons", "atmosphere", "venus", "mars", "jupiter", "saturn"],
  constellations: ["constellation", "constellations", "chom sao", "zodiac", "orion", "ursa", "scorpius", "visible"],
  observatories: ["observatory", "observatories", "dai quan sat", "stargazing site", "near me", "nearby", "gan toi"],
  news: ["news", "tin tuc", "latest", "nasa", "mission", "spaceflight", "discovery"],
  events: ["event", "events", "meteor", "shower", "eclipse", "comet", "supermoon", "conjunction"],
};

function clampLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, parsed));
}

function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, keywords) {
  const normalizedText = normalizeSearchText(text);
  const words = normalizedText.split(/\s+/).filter(Boolean);

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (!normalizedKeyword) return false;
    if (normalizedKeyword.includes(" ")) return normalizedText.includes(normalizedKeyword);
    return words.includes(normalizedKeyword);
  });
}

function tokenize(normalizedQuery) {
  return normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function detectMonth(normalizedQuery) {
  for (let i = 0; i < MONTHS.length; i += 1) {
    if (MONTHS[i].some((alias) => normalizedQuery.includes(alias))) {
      return { number: i + 1, name: MONTH_NAMES[i], season: MONTH_TO_SEASON[i + 1] };
    }
  }

  const numericMonth = normalizedQuery.match(/\b(?:month|thang)\s*(1[0-2]|[1-9])\b/);
  if (numericMonth) {
    const number = Number(numericMonth[1]);
    return { number, name: MONTH_NAMES[number - 1], season: MONTH_TO_SEASON[number] };
  }

  return null;
}

function detectSeason(normalizedQuery) {
  const found = SEASONS.find((season) => normalizedQuery.includes(season));
  if (!found) return null;
  return found === "fall" ? "Autumn" : found[0].toUpperCase() + found.slice(1);
}

function detectTargets(normalizedQuery) {
  const targets = Object.entries(TARGET_KEYWORDS)
    .filter(([, keywords]) => includesAny(normalizedQuery, keywords))
    .map(([target]) => target);

  if (targets.length > 0) return targets;
  return ["planets", "constellations", "observatories", "news", "events"];
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

function scoreTextMatch(item, tokens, fields) {
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

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every((value) => Number.isFinite(Number(value)))) {
    return null;
  }

  const radius = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortAndLimit(items, limit) {
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

async function searchPlanets({ tokens, filters, limit }) {
  const planets = await prisma.planet.findMany({
    where: { isVisible: true },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      imageUrl: true,
      hasRings: true,
      numberOfMoons: true,
      atmosphere: true,
      distanceFromSunAu: true,
      avgTempCelsius: true,
    },
  });

  const results = planets.map((planet) => {
    let score = scoreTextMatch(planet, tokens, ["name", "slug", "type", "description", "atmosphere"]);
    const reasons = [];

    if (filters.hasRings) {
      if (!planet.hasRings) return { ...planet, _score: 0, _matchReasons: [] };
      score += 3;
      reasons.push("has rings");
    }
    if (filters.hasMoons) {
      if (Number(planet.numberOfMoons) <= 0) return { ...planet, _score: 0, _matchReasons: [] };
      score += 1.5;
      reasons.push("has moons");
    }
    if (filters.gasGiant) {
      if (!normalizeSearchText(planet.type).includes("gas")) return { ...planet, _score: 0, _matchReasons: [] };
      score += 2;
      reasons.push("gas giant type");
    }
    if (filters.rocky) {
      if (!includesAny(planet.type, ["rocky", "terrestrial"])) return { ...planet, _score: 0, _matchReasons: [] };
      score += 2;
      reasons.push("rocky/terrestrial type");
    }

    if (!reasons.length && score > 0) reasons.push("text match");
    return { ...planet, _score: score, _matchReasons: reasons };
  });

  return sortAndLimit(results, limit);
}

async function searchConstellations({ tokens, filters, limit }) {
  const constellations = await prisma.constellation.findMany({
    where: { isVisible: true },
    select: {
      id: true,
      name: true,
      slug: true,
      latinName: true,
      abbreviation: true,
      family: true,
      quadrant: true,
      imageUrl: true,
      mapUrl: true,
      bestMonth: true,
      bestSeason: true,
      brightestStar: true,
      description: true,
    },
  });

  const results = constellations.map((constellation) => {
    let score = scoreTextMatch(constellation, tokens, [
      "name",
      "slug",
      "latinName",
      "abbreviation",
      "family",
      "quadrant",
      "brightestStar",
      "description",
    ]);
    const reasons = [];

    if (filters.month?.name) {
      if (normalizeSearchText(constellation.bestMonth) === normalizeSearchText(filters.month.name)) {
        score += 3;
        reasons.push(`visible in ${filters.month.name}`);
      } else if (normalizeSearchText(constellation.bestSeason) === normalizeSearchText(filters.month.season)) {
        score += 1.8;
        reasons.push(`${filters.month.season} constellation`);
      } else if (tokens.length <= 2) {
        score = 0;
      }
    }

    if (filters.season) {
      if (normalizeSearchText(constellation.bestSeason) === normalizeSearchText(filters.season)) {
        score += 2.5;
        reasons.push(`${filters.season} constellation`);
      } else if (tokens.length <= 2) {
        score = 0;
      }
    }

    if (!reasons.length && score > 0) reasons.push("text match");
    return { ...constellation, _score: score, _matchReasons: reasons };
  });

  return sortAndLimit(results, limit);
}

async function searchObservatories({ tokens, filters, limit }) {
  const observatories = await prisma.observatory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      type: true,
      imageUrl: true,
      city: true,
      province: true,
      country: true,
      latitude: true,
      longitude: true,
      rating: true,
      reviewCount: true,
      lightPollutionScore: true,
      skyQualityScore: true,
      isFeatured: true,
    },
  });

  const results = observatories.map((observatory) => {
    let score = scoreTextMatch(observatory, tokens, [
      "name",
      "slug",
      "description",
      "type",
      "city",
      "province",
      "country",
    ]);
    const reasons = [];

    if (filters.featured && observatory.isFeatured) {
      score += 1.5;
      reasons.push("featured observatory");
    }

    if (filters.lowLightPollution && observatory.lightPollutionScore != null) {
      score += Math.max(0, (100 - observatory.lightPollutionScore) / 35);
      reasons.push("lower light pollution");
    }

    if (filters.nearMe && filters.lat != null && filters.lon != null) {
      const distanceKm = calculateDistanceKm(filters.lat, filters.lon, observatory.latitude, observatory.longitude);
      if (distanceKm === null) return { ...observatory, _score: 0, _matchReasons: [] };
      score += Math.max(0, 5 - distanceKm / 40);
      reasons.push(`${Number(distanceKm.toFixed(1))}km away`);
      return { ...observatory, distanceKm: Number(distanceKm.toFixed(1)), _score: score, _matchReasons: reasons };
    }

    if (!reasons.length && score > 0) reasons.push("text match");
    return { ...observatory, _score: score, _matchReasons: reasons };
  });

  return sortAndLimit(results, limit);
}

async function searchNews({ tokens, filters, limit }) {
  const searchableTokens = tokens.filter((token) => !NEWS_DISCOVERY_TOKENS.has(token));
  const where = searchableTokens.length
    ? {
        OR: searchableTokens.flatMap((token) => [
          { title: { contains: token, mode: "insensitive" } },
          { source: { contains: token, mode: "insensitive" } },
          { summary: { contains: token, mode: "insensitive" } },
          { tags: { has: token } },
        ]),
      }
    : {};

  const articles = await prisma.newsArticle.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: Math.max(limit * 3, 12),
    select: {
      id: true,
      title: true,
      slug: true,
      source: true,
      sourceUrl: true,
      imageUrl: true,
      publishedAt: true,
      category: true,
      summary: true,
      aiSummary: true,
      tags: true,
    },
  });

  const results = articles.map((article) => {
    let score = scoreTextMatch(article, tokens, ["title", "source", "summary", "aiSummary", "tags"]);
    const reasons = [];

    if (filters.latest) {
      score += 1;
      reasons.push("recent news");
    }
    if (!reasons.length && score > 0) reasons.push("text match");

    return { ...article, _score: score || (filters.latest ? 1 : 0), _matchReasons: reasons };
  });

  return sortAndLimit(results, limit);
}

async function searchEvents({ tokens, limit }) {
  const events = await prisma.celestialEvent.findMany({
    where: {
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: Math.max(limit * 3, 12),
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      description: true,
      imageUrl: true,
      startDate: true,
      peakDate: true,
      visibleFrom: true,
      aiSummary: true,
    },
  });

  const results = events.map((event) => {
    const score = scoreTextMatch(event, tokens, ["title", "slug", "type", "description", "visibleFrom", "aiSummary"]) || 0.5;
    return { ...event, _score: score, _matchReasons: score > 0.5 ? ["text match"] : ["upcoming event"] };
  });

  return sortAndLimit(results, limit);
}

export async function smartSearch({ query, limit = DEFAULT_LIMIT, ...params }) {
  const rawQuery = String(query || params.q || "").trim();
  if (!rawQuery) throw new AppError("Search query is required. Use ?q=show planets with rings", 400);

  const normalizedQuery = normalizeSearchText(rawQuery);
  const tokens = tokenize(normalizedQuery);
  const filters = detectFilters(normalizedQuery, params);
  const targets = detectTargets(normalizedQuery);
  const safeLimit = clampLimit(limit);

  const tasks = {
    planets: () => searchPlanets({ tokens, filters, limit: safeLimit }),
    constellations: () => searchConstellations({ tokens, filters, limit: safeLimit }),
    observatories: () => searchObservatories({ tokens, filters, limit: safeLimit }),
    news: () => searchNews({ tokens, filters, limit: safeLimit }),
    events: () => searchEvents({ tokens, filters, limit: safeLimit }),
  };

  const entries = await Promise.all(
    targets.map(async (target) => [target, await tasks[target]()])
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
