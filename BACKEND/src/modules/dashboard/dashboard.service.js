import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app.error.util.js";
import { calculateDistanceKm } from "../../utils/geo.util.js";
import { clampInteger } from "../../utils/service.util.js";
import { createLogger } from "../../utils/logger.util.js";

import {
  getCurrentWeatherByCoordinates,
} from "../../services/external/weather.service.js";

import {
  getDashboardNewsHighlights,
} from "../news/news.service.js";

import {
  getApod,
  getNearEarthObjectsRange,
} from "../../services/external/nasa.service.js";

import {
  getUpcomingLaunches,
} from "../../services/external/spaceflight.service.js";

const DEFAULT_SECTION_LIMIT = 5;
const MAX_SECTION_LIMIT = 20;
const logger = createLogger("dashboard");

function getSkyLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Bad";
}

function calculateSkyVisibilityScore({
  cloudiness = 0,
  humidity = 0,
  condition = "",
  windSpeed = 0,
  lightPollutionScore = 0,
}) {
  let score = 100;

  score -= Number(cloudiness || 0) * 0.5;

  if (humidity > 85) score -= 18;
  else if (humidity > 70) score -= 10;
  else if (humidity > 55) score -= 5;

  const badConditions = ["Rain", "Thunderstorm", "Snow", "Mist", "Fog", "Drizzle"];
  const fairConditions = ["Clouds", "Haze"];

  if (badConditions.includes(condition)) score -= 25;
  if (fairConditions.includes(condition)) score -= 12;

  if (windSpeed > 12) score -= 8;
  else if (windSpeed > 8) score -= 4;

  if (lightPollutionScore) {
    score -= Number(lightPollutionScore) * 0.2;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildSkySuggestion(score, weather, context = {}) {
  const label = getSkyLabel(score);
  const nearest = context.nearestObservatory
    ? ` Nearest DB observing site: ${context.nearestObservatory.name} (${context.nearestObservatory.distanceKm} km).`
    : "";
  const nasa = context.nasaEvent
    ? ` NASA signal: ${context.nasaEvent.title}.`
    : "";
  const launch = context.launchEvent
    ? ` Upcoming spaceflight: ${context.launchEvent.title}.`
    : "";

  if (score >= 85) {
    return `Sky conditions look excellent for stargazing. Clear views are likely if local light pollution is low.${nearest}${nasa}${launch}`;
  }

  if (score >= 70) {
    return `Sky conditions look good. You may be able to observe bright planets, the Moon, and major constellations.${nearest}${nasa}${launch}`;
  }

  if (score >= 50) {
    return `Sky conditions are fair. Observation is possible, but clouds or humidity may reduce visibility.${nearest}${nasa}${launch}`;
  }

  if (score >= 30) {
    return `Sky conditions are poor. Consider waiting for clearer weather before planning a stargazing session.${nearest}${nasa}${launch}`;
  }

  return `Sky conditions are not suitable for stargazing right now. ${weather?.description || ""}${nearest}${nasa}${launch}`;
}

async function resolveUserLocation(userId, query = {}) {
  const queryLat = query.lat !== undefined && query.lat !== null ? Number(query.lat) : query.latitude !== undefined && query.latitude !== null ? Number(query.latitude) : null;
  const queryLng = query.lng !== undefined && query.lng !== null ? Number(query.lng) : query.longitude !== undefined && query.longitude !== null ? Number(query.longitude) : null;

  const hasCoords = Number.isFinite(queryLat) && Number.isFinite(queryLng);
  if (hasCoords) {
    return {
      latitude: queryLat,
      longitude: queryLng,
      name: query.locationName || "Current location",
      timezone: query.timezone || env.DEFAULT_LOCATION_TIMEZONE || "UTC",
      source: "query",
    };
  }

  if (!userId) {
    return {
      latitude: env.DEFAULT_LOCATION_LATITUDE,
      longitude: env.DEFAULT_LOCATION_LONGITUDE,
      name: env.DEFAULT_LOCATION_NAME,
      timezone: env.DEFAULT_LOCATION_TIMEZONE,
      source: "default",
    };
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!Number.isFinite(Number(profile?.latitude)) || !Number.isFinite(Number(profile?.longitude))) {
    throw new AppError("User location is not available. Please update your profile location.", 400);
  }

  return {
    latitude: profile.latitude,
    longitude: profile.longitude,
    name: profile.location || "Saved location",
    timezone: profile.timezone || "UTC",
    source: "profile",
  };
}

async function getNearestObservatories(latitude, longitude, limit = 5) {
  const safeLimit = clampInteger(limit, { fallback: DEFAULT_SECTION_LIMIT, max: MAX_SECTION_LIMIT });
  const observatories = await prisma.observatory.findMany({
    where: {
      isActive: true,
    },
    take: 50,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      address: true,
      city: true,
      province: true,
      country: true,
      type: true,
      latitude: true,
      longitude: true,
      website: true,
      equipment: true,
      openingHours: true,
      rating: true,
      reviewCount: true,
      lightPollutionScore: true,
      skyQualityScore: true,
      isFeatured: true,
    },
  });

  return observatories
    .map((item) => {
      const distanceKm = calculateDistanceKm(latitude, longitude, item.latitude, item.longitude);
      return distanceKm === null
        ? null
        : { ...item, distanceKm: Number(distanceKm.toFixed(2)) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, safeLimit);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeLocalEvent(event) {
  return {
    ...event,
    source: "CosmoVision DB",
    sourceUrl: null,
    external: false,
  };
}

function normalizeNeoEvent(neo) {
  const diameterMax = neo.estimatedDiameterMaxKm != null
    ? `${neo.estimatedDiameterMaxKm.toFixed(2)} km max diameter`
    : "Diameter unavailable";
  const missDistance = neo.missDistanceKm != null
    ? `${Math.round(neo.missDistanceKm).toLocaleString("en-US")} km miss distance`
    : "Miss distance unavailable";

  return {
    id: `nasa-neo-${neo.id}-${neo.closestApproachDate}`,
    title: `${neo.name} close approach`,
    slug: `nasa-neo-${neo.id}`,
    type: "NEAR_EARTH_OBJECT",
    description: `${diameterMax}; ${missDistance}.`,
    imageUrl: "https://www.nasa.gov/wp-content/uploads/2023/03/asteroid-bennu.jpeg",
    startDate: neo.closestApproachDate ? new Date(neo.closestApproachDate) : new Date(),
    endDate: null,
    peakDate: neo.closestApproachDate ? new Date(neo.closestApproachDate) : null,
    visibleFrom: ["NASA NeoWs"],
    aiSummary: neo.isPotentiallyHazardous
      ? "NASA flags this object as potentially hazardous."
      : "NASA-tracked near-Earth object.",
    source: "NASA NeoWs",
    sourceUrl: neo.nasaJplUrl,
    external: true,
  };
}

async function getExternalUpcomingEvents(limit = 5) {
  const safeLimit = clampInteger(limit, { fallback: DEFAULT_SECTION_LIMIT, max: MAX_SECTION_LIMIT });
  const start = new Date();
  const end = addDays(start, 7);

  const [neoResult, launchResult] = await Promise.allSettled([
    getNearEarthObjectsRange(start, end),
    getUpcomingLaunches({ limit: safeLimit }),
  ]);

  const neoEvents = neoResult.status === "fulfilled"
    ? neoResult.value.slice(0, safeLimit).map(normalizeNeoEvent)
    : [];

  if (neoResult.status === "rejected") {
    logger.error("NASA NeoWs upcoming failed", neoResult.reason);
  }

  const launchEvents = launchResult.status === "fulfilled"
    ? launchResult.value
    : [];

  if (launchResult.status === "rejected") {
    logger.error("Launch Library upcoming failed", launchResult.reason);
  }

  return [...neoEvents, ...launchEvents];
}

async function getUpcomingEvents(limit = 5) {
  const safeLimit = clampInteger(limit, { fallback: DEFAULT_SECTION_LIMIT, max: MAX_SECTION_LIMIT });
  const localEvents = await prisma.celestialEvent.findMany({
    where: {
      startDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      startDate: "asc",
    },
    take: safeLimit,
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      description: true,
      imageUrl: true,
      startDate: true,
      endDate: true,
      peakDate: true,
      visibleFrom: true,
      aiSummary: true,
    },
  });

  const externalEvents = await getExternalUpcomingEvents(safeLimit);

  return [...localEvents.map(normalizeLocalEvent), ...externalEvents]
    .filter((event) => event.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, safeLimit);
}

async function getLatestRecommendation(userId) {
  if (!userId) return null;

  return prisma.recommendation.findFirst({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
}

async function createRecommendationSnapshot({
  userId,
  location,
  weather,
  skyVisibilityScore,
  aiSuggestion,
}) {
  if (!userId) return null;

  try {
    return await prisma.recommendation.create({
      data: {
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: location.name,
        weatherCondition: weather?.condition || null,
        temperature: weather?.temperature ?? null,
        humidity: weather?.humidity ?? null,
        skyVisibilityScore,
        aiSuggestion,
      },
    });
  } catch (error) {
    logger.error("Create recommendation snapshot failed", error);
    return null;
  }
}

export async function getDashboardData({ userId, query = {} }) {
  const location = await resolveUserLocation(userId, query);

  const [weatherResult, upcomingEvents, latestNews, nearbyObservatories, latestRecommendation, apodResult] =
    await Promise.all([
      getCurrentWeatherByCoordinates(location.latitude, location.longitude),
      getUpcomingEvents(5),
      getDashboardNewsHighlights(5),
      getNearestObservatories(location.latitude, location.longitude, 5),
      getLatestRecommendation(userId),
      getApod().catch((error) => {
        logger.error("NASA APOD failed", error);
        return null;
      }),
    ]);

  const weather = weatherResult?.success ? weatherResult.data : weatherResult;

  const nearestLightPollution =
    nearbyObservatories?.[0]?.lightPollutionScore ?? 0;

  const skyVisibilityScore = calculateSkyVisibilityScore({
    cloudiness: weather?.cloudCover ?? weather?.cloudiness ?? 0,
    humidity: weather?.humidity || 0,
    condition: weather?.condition || "",
    windSpeed: weather?.windSpeed || 0,
    lightPollutionScore: nearestLightPollution,
  });

  const nasaEvent = upcomingEvents.find((event) => event.source === "NASA NeoWs")
    || (apodResult
      ? {
          title: `APOD - ${apodResult.title}`,
          source: "NASA APOD",
        }
      : null);
  const launchEvent = upcomingEvents.find((event) => event.type === "SPACE_LAUNCH");

  const skySuggestion = buildSkySuggestion(skyVisibilityScore, weather, {
    nearestObservatory: nearbyObservatories?.[0],
    nasaEvent,
    launchEvent,
  });

  const snapshot = await createRecommendationSnapshot({
    userId,
    location,
    weather,
    skyVisibilityScore,
    aiSuggestion: skySuggestion,
  });

  return {
    current: {
      datetime: new Date().toISOString(),
      location,
    },
    sky: {
      score: skyVisibilityScore,
      label: getSkyLabel(skyVisibilityScore),
      suggestion: skySuggestion,
      weather,
    },
    recommendation: snapshot || latestRecommendation,
    upcomingEvents,
    latestNews,
    nearbyObservatories,
    externalSignals: {
      apod: apodResult,
      nasaEvent,
      launchEvent,
    },
  };
}
