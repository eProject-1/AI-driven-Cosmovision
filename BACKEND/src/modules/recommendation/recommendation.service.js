import prisma from "../../config/db.js";
import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { clampInteger } from "../../utils/service.util.js";

import { trackAnalyticsEvent } from "../../services/analytics/analytics.service.js";
import { geocode, reverseGeocode } from "../../services/external/maps.service.js";
import { getApod, getNearEarthObjects } from "../../services/external/nasa.service.js";
import { getWeatherByCoords, roundCoord } from "../../services/external/weather.service.js";
import {
  deriveNasaInfluence,
  getNearbyObservatories,
  getVisibleConstellations,
  getVisiblePlanets,
} from "./recommendation.sources.service.js";
import {
  buildRuleBasedSuggestion,
  generateAiSuggestion,
} from "./recommendation.suggestion.service.js";

const logger = createLogger("recommendation");
const RECOMMENDATION_CACHE_TTL_MIN = parseInt(process.env.RECOMMENDATION_CACHE_TTL_MINUTES || "30", 10);
const SKY_SCORE_AI_THRESHOLD = parseInt(process.env.SKY_SCORE_AI_THRESHOLD || "40", 10);

export async function createRecommendation({ userId, latitude, longitude, locationName, forceRefresh = false }) {
  const resolvedLocation = await resolveRecommendationLocation({ latitude, longitude, locationName });
  const locationKey = buildLocationKey(resolvedLocation.latitude, resolvedLocation.longitude);

  if (!forceRefresh) {
    const cached = await getCachedRecommendation(userId, locationKey);
    if (cached) return { ...cached, fromCache: true };
  }

  const context = await loadRecommendationContext(resolvedLocation);
  const recommendationInput = await buildRecommendationInput({
    userId,
    locationKey,
    resolvedLocation,
    context,
  });
  const recommendation = await prisma.recommendation.create({ data: recommendationInput.data });

  trackRecommendationCreated({
    userId,
    recommendation,
    recommendationInput,
    locationKey,
  });

  return buildRecommendationResponse({
    recommendation,
    recommendationInput,
    context,
  });
}

export async function getUserRecommendations(userId, { limit = 10 } = {}) {
  return prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: clampInteger(limit),
    select: {
      id: true,
      locationName: true,
      latitude: true,
      longitude: true,
      skyVisibilityScore: true,
      weatherCondition: true,
      temperature: true,
      bestTimeStart: true,
      bestTimeEnd: true,
      visiblePlanets: true,
      visibleConstellations: true,
      nearbyObservatories: true,
      aiSuggestion: true,
      createdAt: true,
    },
  });
}

export async function getRecommendationById(id, requestingUserId) {
  const recommendation = await prisma.recommendation.findUnique({ where: { id } });

  if (!recommendation) throw new AppError("Recommendation not found", 404);
  if (recommendation.userId !== requestingUserId) {
    throw new AppError("You do not have permission to view this recommendation", 403);
  }

  return recommendation;
}

async function resolveRecommendationLocation({ latitude, longitude, locationName }) {
  const hasCoords = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  if (hasCoords) {
    return {
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationName: locationName?.trim() || null,
    };
  }

  if (!locationName?.trim()) {
    throw new AppError("Enter a location name or provide both latitude and longitude.", 400);
  }

  const matches = await geocode(locationName.trim(), 1);
  const firstMatch = matches[0];
  if (!firstMatch) {
    throw new AppError("Could not find coordinates for that location. Try a more specific place name.", 404);
  }

  return {
    latitude: firstMatch.lat,
    longitude: firstMatch.lon,
    locationName: firstMatch.displayName || locationName.trim(),
  };
}

function buildLocationKey(lat, lon) {
  return `${roundCoord(lat)}_${roundCoord(lon)}`;
}

async function getCachedRecommendation(userId, locationKey) {
  try {
    return await prisma.recommendation.findFirst({
      where: {
        userId,
        locationKey,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("Read recommendation cache failed", error);
    return null;
  }
}

async function loadRecommendationContext({ latitude, longitude }) {
  const [weatherResult, locationResult, apodResult, neoResult, planetsResult, observatoryResult] =
    await Promise.allSettled([
      getWeatherByCoords(latitude, longitude),
      reverseGeocode(latitude, longitude),
      getApod(),
      getNearEarthObjects(),
      getVisiblePlanets(),
      getNearbyObservatories(latitude, longitude),
    ]);

  logRejectedSources({
    "Weather API": weatherResult,
    Geocoding: locationResult,
    "NASA APOD": apodResult,
    "NASA NEO": neoResult,
    "DB planets": planetsResult,
    "DB observatory": observatoryResult,
  });

  return {
    weatherData: valueOrFallback(weatherResult, fallbackWeatherData()),
    locationData: valueOrFallback(locationResult, null),
    apodData: valueOrFallback(apodResult, null),
    neoData: valueOrFallback(neoResult, []),
    planetsRaw: valueOrFallback(planetsResult, []),
    observatories: valueOrFallback(observatoryResult, []),
  };
}

async function buildRecommendationInput({ userId, locationKey, resolvedLocation, context }) {
  const nasaInfluence = deriveNasaInfluence({
    apod: context.apodData,
    neoList: context.neoData,
    planets: context.planetsRaw,
  });
  const planets = nasaInfluence.reorderedPlanets;
  const skyVisibilityScore = calculateSkyVisibilityScore(context.weatherData);
  const tier = getSkyScoreTier(skyVisibilityScore);
  const { bestTimeStart, bestTimeEnd } = calculateBestTimeWindow(
    skyVisibilityScore,
    context.weatherData.sunset
  );
  const constellations = getVisibleConstellations();
  const planetNames = planets.map((planet) => planet.name);
  const resolvedLocationName = resolveLocationName({
    locationName: resolvedLocation.locationName,
    locationData: context.locationData,
  });
  const aiSuggestion = await buildObservationSuggestion({
    resolvedLocationName,
    skyVisibilityScore,
    tier,
    planets,
    constellations,
    nasaInfluence,
    context,
  });

  return {
    skyVisibilityScore,
    tier,
    planets,
    constellations,
    planetNames,
    nasaInfluence,
    aiGenerated: skyVisibilityScore >= SKY_SCORE_AI_THRESHOLD,
    data: {
      userId,
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      locationKey,
      locationName: resolvedLocationName,
      weatherCondition: context.weatherData.condition,
      temperature: context.weatherData.temperature,
      humidity: context.weatherData.humidity,
      skyVisibilityScore,
      bestTimeStart,
      bestTimeEnd,
      visiblePlanets: planetNames,
      visibleConstellations: constellations,
      nearbyObservatories: context.observatories.map((observatory) => observatory.slug),
      aiSuggestion,
      expiresAt: new Date(Date.now() + RECOMMENDATION_CACHE_TTL_MIN * 60 * 1000),
    },
  };
}

async function buildObservationSuggestion({
  resolvedLocationName,
  skyVisibilityScore,
  tier,
  planets,
  constellations,
  nasaInfluence,
  context,
}) {
  if (skyVisibilityScore < SKY_SCORE_AI_THRESHOLD) {
    return buildRuleBasedSuggestion({
      locationLabel: resolvedLocationName || "your location",
      skyScore: skyVisibilityScore,
      tier,
      planets,
      constellations,
      nasaInfluence,
    });
  }

  return generateAiSuggestion({
    locationInfo: context.locationData,
    weather: context.weatherData,
    skyScore: skyVisibilityScore,
    tier,
    planets,
    constellations,
    apod: context.apodData,
    nearbyNeo: context.neoData,
    nasaInfluence,
    observatories: context.observatories,
  });
}

function buildRecommendationResponse({ recommendation, recommendationInput, context }) {
  return {
    ...recommendation,
    fromCache: false,
    weatherDetail: {
      ...context.weatherData,
      label: context.weatherData.label || context.weatherData.condition,
    },
    locationDetail: context.locationData,
    skyScoreTier: recommendationInput.tier,
    nasaApod: buildNasaApodPayload(context.apodData),
    nearEarthObjects: context.neoData.slice(0, 3).map(buildNearEarthObjectPayload),
    priorityNasaEvent: recommendationInput.nasaInfluence.priorityEvent,
    nearbyObservatoryDetail: context.observatories,
    dataSourceInfo: {
      weatherIsMock: context.weatherData.isMock ?? false,
      geocodingAvailable: !!context.locationData,
      nasaApodAvailable: !!context.apodData,
      nasaNeoAvailable: context.neoData.length > 0,
      observatoriesFound: context.observatories.length,
      aiGenerated: recommendationInput.aiGenerated,
    },
  };
}

function trackRecommendationCreated({ userId, recommendation, recommendationInput, locationKey }) {
  trackAnalyticsEvent({
    userId,
    event: "RECOMMENDATION_REQUEST",
    entityType: "recommendation",
    entityId: recommendation.id,
    entityName: recommendation.locationName || locationKey,
    metadata: {
      skyVisibilityScore: recommendationInput.skyVisibilityScore,
      weatherCondition: recommendation.weatherCondition,
      visiblePlanets: recommendationInput.planetNames,
      visibleConstellations: recommendationInput.constellations,
      observatoriesFound: recommendationInput.data.nearbyObservatories.length,
      aiGenerated: recommendationInput.aiGenerated,
    },
  }).catch((error) => logger.error("Analytics recommendation tracking failed", error));
}

function calculateSkyVisibilityScore(weather) {
  const { cloudCover = 50, humidity = 70, visibility = 5 } = weather;
  const cloudScore = Math.round((1 - cloudCover / 100) * 40);
  const humidityScore = Math.round(Math.max(0, 1 - humidity / 100) * 30);
  const visibilityScore = Math.round(Math.min(1, visibility / 20) * 30);

  return Math.min(100, cloudScore + humidityScore + visibilityScore);
}

function getSkyScoreTier(score) {
  if (score >= 90) return { tier: "EXCELLENT", label: "Excellent" };
  if (score >= 70) return { tier: "GOOD", label: "Good" };
  if (score >= 50) return { tier: "FAIR", label: "Fair" };
  if (score >= SKY_SCORE_AI_THRESHOLD) return { tier: "BELOW_FAIR", label: "Below fair" };
  return { tier: "POOR", label: "Poor" };
}

function calculateBestTimeWindow(skyScore, sunset = null) {
  let startHour;

  if (sunset instanceof Date) {
    startHour = sunset.getHours() + 1 + Math.round(sunset.getMinutes() / 60);
  } else {
    startHour = skyScore >= 70 ? 20 : skyScore >= 50 ? 21 : 22;
  }

  startHour = Math.min(startHour, 23);
  const endHour = startHour + 2;
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  if (new Date().getHours() < 12) base.setDate(base.getDate() - 1);

  const bestTimeStart = new Date(base);
  bestTimeStart.setHours(startHour, 0, 0, 0);

  const bestTimeEnd = new Date(base);
  bestTimeEnd.setHours(endHour % 24, 0, 0, 0);
  if (endHour >= 24) bestTimeEnd.setDate(bestTimeEnd.getDate() + 1);

  return { bestTimeStart, bestTimeEnd };
}

function resolveLocationName({ locationName, locationData }) {
  if (locationName) return locationName;
  if (locationData?.city) {
    return `${locationData.city}${locationData.country ? ", " + locationData.country : ""}`;
  }
  return locationData?.displayName || null;
}

function valueOrFallback(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function fallbackWeatherData() {
  return {
    condition: "clear",
    label: "Unknown",
    temperature: 25,
    humidity: 60,
    cloudCover: 10,
    windSpeed: 5,
    visibility: 10,
    isMock: true,
  };
}

function logRejectedSources(resultsByName) {
  for (const [name, result] of Object.entries(resultsByName)) {
    if (result.status === "rejected") {
      logger.error(`${name} failed`, result.reason);
    }
  }
}

function buildNasaApodPayload(apodData) {
  if (!apodData) return null;
  return {
    title: apodData.title,
    url: apodData.url,
    mediaType: apodData.mediaType,
  };
}

function buildNearEarthObjectPayload(nearEarthObject) {
  return {
    name: nearEarthObject.name,
    isPotentiallyHazardous: nearEarthObject.isPotentiallyHazardous,
    missDistanceKm: nearEarthObject.missDistanceKm ? Math.round(nearEarthObject.missDistanceKm) : null,
  };
}
