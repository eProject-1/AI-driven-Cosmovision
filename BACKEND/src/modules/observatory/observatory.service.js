import prisma from "../../config/db.js";
import { AppError } from "../../utils/app.error.util.js";
import { getUserRecommendations } from "../recommendation/recommendation.service.js";
import {
  applyTextFilters,
  buildObservatoryWhere,
  calculateDistanceKm,
  clampLimit,
  formatObservatory,
  getObservingCondition,
  parsePagination,
} from "./observatory.helpers.js";

const DEFAULT_NEARBY_RADIUS_KM = 100;
const MAX_NEARBY_RADIUS_KM = 500;
const defaultObservatoryOrder = [
  { isFeatured: "desc" },
  { rating: "desc" },
  { name: "asc" },
];

const observatoryWriteFields = [
  "name",
  "slug",
  "description",
  "type",
  "latitude",
  "longitude",
  "address",
  "city",
  "province",
  "country",
  "elevation",
  "website",
  "phone",
  "email",
  "imageUrl",
  "equipment",
  "openingHours",
  "rating",
  "reviewCount",
  "lightPollutionScore",
  "skyQualityScore",
  "isFeatured",
  "isActive",
];

export async function createObservatory(payload) {
  const data = buildObservatoryWriteData(payload, { requireBasics: true });
  const observatory = await prisma.observatory.create({ data });
  return formatObservatory(observatory);
}

export async function updateObservatory(slug, payload) {
  const existing = await findObservatoryIdBySlug(slug);
  const observatory = await prisma.observatory.update({
    where: { id: existing.id },
    data: buildObservatoryWriteData(payload),
  });
  return formatObservatory(observatory);
}

export async function deleteObservatory(slug) {
  const existing = await findObservatoryIdBySlug(slug);
  await prisma.observatory.update({
    where: { id: existing.id },
    data: { isActive: false },
  });
  return { slug, deleted: true };
}

export async function getAllObservatories(query = {}) {
  const { page, limit, skip, take } = parsePagination(query);
  const allObservatories = await prisma.observatory.findMany({
    where: buildObservatoryWhere(query),
    orderBy: defaultObservatoryOrder,
  });
  const filteredObservatories = applyTextFilters(allObservatories, query);
  const observatories = filteredObservatories.slice(skip, skip + take);

  return {
    observatories: observatories.map((obs) => formatObservatory(obs)),
    pagination: {
      page,
      limit,
      total: filteredObservatories.length,
      totalPages: Math.ceil(filteredObservatories.length / limit),
      hasNext: skip + take < filteredObservatories.length,
      hasPrev: page > 1,
    },
  };
}

export async function getNearbyObservatories(
  lat,
  lon,
  radiusKm = DEFAULT_NEARBY_RADIUS_KM,
  options = {}
) {
  validateCoordinates(lat, lon);

  const radius = Math.min(MAX_NEARBY_RADIUS_KM, Math.max(1, radiusKm));
  const observatories = await prisma.observatory.findMany({
    where: { isActive: true },
    orderBy: defaultObservatoryOrder,
  });
  const nearby = observatories
    .map((obs) => ({
      obs,
      distanceKm: Number(calculateDistanceKm(lat, lon, obs.latitude, obs.longitude).toFixed(2)),
    }))
    .filter((item) => item.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, clampLimit(options.limit));

  const results = await Promise.all(
    nearby.map(async ({ obs, distanceKm }) => {
      const formatted = formatObservatory(obs, distanceKm);
      if (!options.includeWeather) return formatted;
      return { ...formatted, observingCondition: await getObservingCondition(obs) };
    })
  );

  return {
    results,
    meta: {
      lat,
      lon,
      radiusKm: radius,
      total: results.length,
      source: "database",
    },
  };
}

export async function getObservatoryBySlug(slug, userId = null) {
  const observatory = await prisma.observatory.findUnique({
    where: { slug },
    include: {
      _count: { select: { savedBy: true } },
    },
  });

  if (!observatory) throw new AppError("Observatory not found", 404);

  const isSaved = userId ? await isObservatorySaved(userId, observatory.id) : false;
  return {
    ...formatObservatory(observatory),
    observingCondition: await getObservingCondition(observatory),
    savedCount: observatory._count.savedBy,
    isSaved,
  };
}

export async function getObservatoryStats(query = {}, userId = null) {
  const [allObservatories, savedCount] = await Promise.all([
    prisma.observatory.findMany({ where: buildObservatoryWhere(query) }),
    userId ? prisma.savedObservatory.count({ where: { userId } }) : Promise.resolve(0),
  ]);
  const observatories = applyTextFilters(allObservatories, query);
  const avgSkyQuality = numericAverage(observatories, "skyQualityScore");
  const avgLightPollution = numericAverage(observatories, "lightPollutionScore");
  const avgElevation = numericAverage(observatories, "elevation");

  return {
    total: observatories.length,
    featured: observatories.filter((obs) => obs.isFeatured).length,
    savedCount,
    averages: {
      skyQualityScore: avgSkyQuality ? Number(avgSkyQuality.toFixed(1)) : null,
      lightPollutionScore: avgLightPollution ? Number(avgLightPollution.toFixed(1)) : null,
      elevation: avgElevation ? Number(avgElevation.toFixed(0)) : null,
    },
  };
}

export async function toggleSaveObservatory(observatoryId, userId) {
  const observatory = await ensureObservatoryExists(observatoryId);
  const existing = await prisma.savedObservatory.findUnique({
    where: {
      userId_observatoryId: { userId, observatoryId },
    },
  });

  if (existing) {
    await prisma.savedObservatory.delete({
      where: {
        userId_observatoryId: { userId, observatoryId },
      },
    });
    return { saved: false, observatoryName: observatory.name };
  }

  await prisma.savedObservatory.create({
    data: { userId, observatoryId },
  });
  return { saved: true, observatoryName: observatory.name };
}

export async function getUserObservatoryPlans(userId, { limit = 10 } = {}) {
  return getUserRecommendations(userId, { limit });
}

async function findObservatoryIdBySlug(slug) {
  const observatory = await prisma.observatory.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!observatory) throw new AppError("Observatory not found", 404);
  return observatory;
}

function buildObservatoryWriteData(payload = {}, { requireBasics = false } = {}) {
  const data = pickDefined(payload, observatoryWriteFields);

  if (data.name) data.name = String(data.name).trim();
  if (!data.slug && data.name && requireBasics) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);
  if (data.type) data.type = String(data.type).toUpperCase();
  if (data.equipment !== undefined && !Array.isArray(data.equipment)) data.equipment = [];

  for (const field of [
    "latitude",
    "longitude",
    "elevation",
    "rating",
    "lightPollutionScore",
    "skyQualityScore",
  ]) {
    if (data[field] !== undefined) data[field] = Number(data[field]);
  }
  if (data.reviewCount !== undefined) data.reviewCount = Number.parseInt(data.reviewCount, 10);

  if (
    requireBasics &&
    (!data.name || !data.slug || !data.description || data.latitude === undefined || data.longitude === undefined)
  ) {
    throw new AppError("Observatory name, description, latitude, and longitude are required.", 400);
  }

  return data;
}

function validateCoordinates(lat, lon) {
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new AppError("lat and lon must be valid numbers", 400);
  }
  if (lat < -90 || lat > 90) throw new AppError("Latitude must be between -90 and 90", 400);
  if (lon < -180 || lon > 180) throw new AppError("Longitude must be between -180 and 180", 400);
}

async function isObservatorySaved(userId, observatoryId) {
  const saved = await prisma.savedObservatory.findUnique({
    where: {
      userId_observatoryId: { userId, observatoryId },
    },
    select: { id: true },
  });
  return Boolean(saved);
}

async function ensureObservatoryExists(observatoryId) {
  const observatory = await prisma.observatory.findUnique({
    where: { id: observatoryId },
    select: { id: true, name: true },
  });

  if (!observatory) throw new AppError("Observatory not found", 404);
  return observatory;
}

function numericAverage(items, key) {
  const values = items
    .map((item) => item[key])
    .filter((value) => value !== null && value !== undefined);

  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pickDefined(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
