import prisma from "../../config/db.js";
import {
  calculateDistanceKm,
  includesAny,
  normalizeSearchText,
  scoreTextMatch,
  sortAndLimit,
} from "./search.ranking.js";

const NEWS_DISCOVERY_TOKENS = new Set([
  "news", "latest", "new", "recent", "tin", "tuc", "moi",
]);

export const SEARCH_ADAPTERS = {
  planets: searchPlanets,
  constellations: searchConstellations,
  observatories: searchObservatories,
  news: searchNews,
  events: searchEvents,
};

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
      diameterKm: true,
      massKg: true,
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
    if (filters.planetMetric) {
      const value = planet[filters.planetMetric.field];
      if (value == null) return { ...planet, _score: 0, _matchReasons: [] };
      score += scorePlanetMetric(value, filters.planetMetric);
      reasons.push(filters.planetMetric.label);
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

function scorePlanetMetric(value, metric) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 0;

  if (metric.field === "diameterKm") return metric.direction === "asc" ? 8 - normalized / 25000 : normalized / 25000;
  if (metric.field === "avgTempCelsius") return metric.direction === "asc" ? 5 - normalized / 80 : normalized / 80;
  if (metric.field === "numberOfMoons") return normalized / 25;
  if (metric.field === "distanceFromSunAu") return metric.direction === "asc" ? 6 - normalized : normalized;
  return 1;
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
