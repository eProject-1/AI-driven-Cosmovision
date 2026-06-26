import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

import {
  getCurrentWeatherByCoordinates,
} from "../../services/external/weather.service.js";

import {
  getDashboardNewsHighlights,
} from "../news/news.service.js";

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function buildSkySuggestion(score, weather) {
  const label = getSkyLabel(score);

  if (score >= 85) {
    return `Sky conditions look excellent for stargazing. Clear views are likely if local light pollution is low.`;
  }

  if (score >= 70) {
    return `Sky conditions look good. You may be able to observe bright planets, the Moon, and major constellations.`;
  }

  if (score >= 50) {
    return `Sky conditions are fair. Observation is possible, but clouds or humidity may reduce visibility.`;
  }

  if (score >= 30) {
    return `Sky conditions are poor. Consider waiting for clearer weather before planning a stargazing session.`;
  }

  return `Sky conditions are not suitable for stargazing right now. ${weather?.description || ""}`;
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

  if (!profile?.latitude || !profile?.longitude) {
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
      country: true,
      latitude: true,
      longitude: true,
      website: true,
      rating: true,
      reviewCount: true,
      lightPollutionScore: true,
      skyQualityScore: true,
      isFeatured: true,
    },
  });

  return observatories
    .map((item) => ({
      ...item,
      distanceKm: Number(calculateDistanceKm(latitude, longitude, item.latitude, item.longitude).toFixed(2)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Number(limit));
}

async function getUpcomingEvents(limit = 5) {
  return prisma.celestialEvent.findMany({
    where: {
      startDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      startDate: "asc",
    },
    take: Number(limit),
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
    console.error("Create recommendation snapshot error:", error.message);
    return null;
  }
}

export async function getDashboardData({ userId, query = {} }) {
  const location = await resolveUserLocation(userId, query);

  const [weatherResult, upcomingEvents, latestNews, nearbyObservatories, latestRecommendation] =
    await Promise.all([
      getCurrentWeatherByCoordinates(location.latitude, location.longitude),
      getUpcomingEvents(5),
      getDashboardNewsHighlights(5),
      getNearestObservatories(location.latitude, location.longitude, 5),
      getLatestRecommendation(userId),
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

  const skySuggestion = buildSkySuggestion(skyVisibilityScore, weather);

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
  };
}
