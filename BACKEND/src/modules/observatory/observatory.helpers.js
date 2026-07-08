import { ObservatoryType } from "@prisma/client";
import { getCurrentWeatherByCoordinates } from "../../services/external/weather.service.js";
import { calculateDistanceKm } from "../../utils/geo.util.js";
import { createLogger } from "../../utils/logger.util.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const logger = createLogger("observatory");

export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(query.limit) || DEFAULT_PAGE_SIZE)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clampLimit(value, fallback = DEFAULT_PAGE_SIZE, max = MAX_PAGE_SIZE) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function parseCsv(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function matchesSearch(obs, search) {
  const term = normalizeText(search);
  if (!term) return true;

  return [
    obs.name,
    obs.description,
    obs.type,
    obs.address,
    obs.city,
    obs.province,
    obs.country,
    ...(obs.equipment || []),
  ].some((value) => normalizeText(value).includes(term));
}

function matchesEquipment(obs, equipmentTerms) {
  if (!equipmentTerms.length) return true;
  const equipmentText = normalizeText((obs.equipment || []).join(" "));

  return equipmentTerms.some((term) =>
    equipmentText.includes(normalizeText(term))
  );
}

export function buildObservatoryWhere(query = {}) {
  const where = { isActive: true };

  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  if (query.province) {
    where.province = { contains: query.province, mode: "insensitive" };
  }

  if (query.country) {
    where.country = { contains: query.country, mode: "insensitive" };
  }

  if (query.type && Object.values(ObservatoryType).includes(query.type.toUpperCase())) {
    where.type = query.type.toUpperCase();
  }

  const minSkyQuality = parseNumber(query.minSkyQuality);
  if (minSkyQuality !== null) {
    where.skyQualityScore = { gte: minSkyQuality };
  }

  const maxLightPollution = parseNumber(query.maxLightPollution);
  if (maxLightPollution !== null) {
    where.lightPollutionScore = { lte: maxLightPollution };
  }

  return where;
}

export function applyTextFilters(observatories, query = {}) {
  const equipment = parseCsv(query.equipment);

  return observatories.filter((obs) =>
    matchesSearch(obs, query.search) &&
    matchesEquipment(obs, equipment)
  );
}

export { calculateDistanceKm };

function buildDirectionsUrl(obs) {
  if (!obs.latitude || !obs.longitude) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${obs.latitude},${obs.longitude}`;
}

function scoreObservingCondition(weather, obs) {
  if (!weather) return null;

  const cloudCover = weather.cloudCover ?? 50;
  const humidity = weather.humidity ?? 60;
  const visibility = weather.visibility ?? 8;
  const windSpeed = weather.windSpeed ?? 8;
  const lightPollution = obs.lightPollutionScore ?? 50;
  const skyQuality = obs.skyQualityScore ?? 50;

  const cloudScore = Math.max(0, 100 - cloudCover);
  const humidityScore = Math.max(0, 100 - humidity);
  const visibilityScore = Math.min(100, visibility * 10);
  const windScore = Math.max(0, 100 - windSpeed * 3);
  const darknessScore = Math.max(0, 100 - lightPollution);

  const score = Math.round(
    cloudScore * 0.32 +
      humidityScore * 0.14 +
      visibilityScore * 0.18 +
      windScore * 0.1 +
      darknessScore * 0.16 +
      skyQuality * 0.1
  );

  let label = "Poor";
  if (score >= 80) label = "Excellent";
  else if (score >= 65) label = "Good";
  else if (score >= 45) label = "Fair";

  const summary =
    score >= 80
      ? "Bau troi rat phu hop cho quan sat."
      : score >= 65
        ? "Dieu kien quan sat kha tot."
        : score >= 45
          ? "Co the quan sat, nhung nen theo doi may va do am."
          : "Dieu kien hien tai chua ly tuong.";

  return {
    score,
    label,
    summary,
    weather: {
      label: weather.label,
      condition: weather.condition,
      temperature: weather.temperature,
      humidity: weather.humidity,
      cloudCover: weather.cloudCover,
      windSpeed: weather.windSpeed,
      visibility: weather.visibility,
      description: weather.description,
      isMock: weather.isMock,
      fromCache: weather.fromCache,
    },
  };
}

export async function getObservingCondition(obs) {
  try {
    const weather = await getCurrentWeatherByCoordinates(obs.latitude, obs.longitude);
    return scoreObservingCondition(weather, obs);
  } catch (error) {
    logger.error("Weather lookup failed", error);
    return null;
  }
}

export function formatObservatory(obs, distanceKm = null) {
  return {
    id: obs.id,
    name: obs.name,
    slug: obs.slug,
    description: obs.description,
    type: obs.type,
    imageUrl: obs.imageUrl,
    directionsUrl: buildDirectionsUrl(obs),
    address: obs.address,
    city: obs.city,
    province: obs.province,
    country: obs.country,
    latitude: obs.latitude,
    longitude: obs.longitude,
    elevation: obs.elevation,
    website: obs.website,
    phone: obs.phone,
    email: obs.email,
    equipment: obs.equipment,
    openingHours: obs.openingHours,
    rating: obs.rating,
    reviewCount: obs.reviewCount,
    lightPollutionScore: obs.lightPollutionScore,
    skyQualityScore: obs.skyQualityScore,
    isFeatured: obs.isFeatured,
    isActive: obs.isActive,
    createdAt: obs.createdAt,
    updatedAt: obs.updatedAt,
    ...(distanceKm !== null && { distanceKm }),
  };
}
