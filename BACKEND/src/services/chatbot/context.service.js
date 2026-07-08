import prisma from "../../config/db.js";
import { geocode } from "../../services/external/maps.service.js";
import { fetchAstronomyNews } from "../../services/external/news.service.js";
import { getApod, getNearEarthObjects } from "../../services/external/nasa.service.js";
import { getWeatherByCoords } from "../../services/external/weather.service.js";
import {
  deriveNasaInfluence,
  getNearbyObservatories,
  getVisibleConstellations,
  getVisiblePlanets,
} from "../../modules/recommendation/recommendation-sources.service.js";
import { INTENT_TYPES } from "./intent.service.js";
import { createLogger } from "../../utils/logger.util.js";

const logger = createLogger("chatbot-context");
const OBSERVING_INTENTS = new Set([INTENT_TYPES.WEATHER, INTENT_TYPES.RECOMMENDATION]);
const NEWS_INTENTS = new Set([INTENT_TYPES.NEWS]);

async function buildChatbotContext({ message, intent, planetName }) {
  const locationName = extractLocationName(message);
  const wantsObserving = locationName || OBSERVING_INTENTS.has(intent?.type);
  const wantsNews = NEWS_INTENTS.has(intent?.type);

  const [planet, observing, news] = await Promise.all([
    getPlanetContext(planetName),
    wantsObserving ? getObservingContext(locationName) : Promise.resolve(null),
    wantsNews ? getNewsContext(message) : Promise.resolve(null),
  ]);

  return compactObject({ planet, observing, news });
}

async function getPlanetContext(planetName) {
  if (!planetName || !prisma?.planet) return null;

  try {
    return prisma.planet.findFirst({
      where: { name: { equals: planetName, mode: "insensitive" } },
      select: {
        name: true,
        slug: true,
        type: true,
        description: true,
        diameterKm: true,
        avgTempCelsius: true,
        atmosphere: true,
        hasRings: true,
        numberOfMoons: true,
        distanceFromSunAu: true,
        orbitalPeriodDays: true,
        gravityMs2: true,
        aiFunFacts: true,
        discoveredBy: true,
        discoveryYear: true,
      },
    });
  } catch (error) {
    logger.error("Get planet context failed", error);
    return null;
  }
}

async function getObservingContext(locationName) {
  const location = locationName ? await resolveLocation(locationName) : null;
  const hasCoordinates = Number.isFinite(location?.lat) && Number.isFinite(location?.lon);
  const [planets, constellations, apodResult, neoResult, weatherResult, observatoryResult] =
    await Promise.allSettled([
      getVisiblePlanets(),
      Promise.resolve(getVisibleConstellations()),
      getApod(),
      getNearEarthObjects(),
      hasCoordinates ? getWeatherByCoords(location.lat, location.lon) : Promise.resolve(null),
      hasCoordinates ? getNearbyObservatories(location.lat, location.lon) : Promise.resolve([]),
    ]);

  const visiblePlanets = valueOr(planets, []);
  const apod = valueOr(apodResult, null);
  const nearEarthObjects = valueOr(neoResult, []);
  const nasaInfluence = deriveNasaInfluence({
    apod,
    neoList: nearEarthObjects,
    planets: visiblePlanets,
  });
  const weather = valueOr(weatherResult, null);

  return compactObject({
    location,
    weather,
    skyVisibilityScore: weather ? calculateSkyVisibilityScore(weather) : null,
    visiblePlanets: nasaInfluence.reorderedPlanets.map((planet) => planet.name),
    visibleConstellations: valueOr(constellations, []),
    nearbyObservatories: valueOr(observatoryResult, []).map(formatObservatory),
    nasaApod: apod ? { title: apod.title, date: apod.date, mediaType: apod.mediaType } : null,
    priorityNasaEvent: nasaInfluence.priorityEvent,
    dataNote: weather?.isMock ? "Weather is mock data because OPENWEATHER_API_KEY is missing." : null,
  });
}

async function getNewsContext(message) {
  const result = await fetchAstronomyNews({
    query: extractNewsQuery(message),
    pageSize: 3,
  });

  return result.success
    ? result.data.map(({ title, source, description, publishedAt, url }) => ({
        title,
        source,
        description,
        publishedAt,
        url,
      }))
    : null;
}

async function resolveLocation(locationName) {
  try {
    const [match] = await geocode(locationName, 1);
    if (!match) return { name: locationName };
    return {
      name: match.displayName || locationName,
      lat: match.lat,
      lon: match.lon,
    };
  } catch (error) {
    logger.error("Resolve chatbot location failed", error);
    return { name: locationName };
  }
}

function extractLocationName(message = "") {
  const text = String(message).replace(/[?!]+/g, " ").trim();
  const match = text.match(/(?:^|\s)(?:from|in|near|at|ở|tai|tại|gan|gần)\s+([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s,.'-]{1,60})/i);
  if (!match) return null;

  return match[1]
    .replace(/\b(tonight|today|now|right now|this evening|đêm nay|hom nay|hôm nay|bay gio|bây giờ|nen|nên|co|có|quan sat|quan sát|ngam|ngắm)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[,.]$/, "") || null;
}

function extractNewsQuery(message = "") {
  const normalized = String(message).toLowerCase();
  if (normalized.includes("nasa")) return "NASA";
  if (normalized.includes("exoplanet")) return "exoplanet";
  if (normalized.includes("moon")) return "moon";
  if (normalized.includes("mars")) return "Mars";
  return "space astronomy";
}

function calculateSkyVisibilityScore(weather) {
  const cloudScore = Math.round((1 - (weather.cloudCover ?? 50) / 100) * 40);
  const humidityScore = Math.round(Math.max(0, 1 - (weather.humidity ?? 70) / 100) * 30);
  const visibilityScore = Math.round(Math.min(1, (weather.visibility ?? 5) / 20) * 30);
  return Math.max(0, Math.min(100, cloudScore + humidityScore + visibilityScore));
}

function formatObservatory(observatory) {
  return {
    name: observatory.name,
    city: observatory.city,
    country: observatory.country,
    distanceKm: observatory.distanceKm,
    skyQualityScore: observatory.skyQualityScore,
  };
}

function valueOr(result, fallback) {
  if (result.status === "fulfilled") return result.value;
  logger.error("Chatbot context source failed", result.reason);
  return fallback;
}

function compactObject(source) {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => {
      if (value == null) return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    })
  );
}

export { buildChatbotContext, extractLocationName };
