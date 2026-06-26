import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { ObservatoryType } from "@prisma/client";
import { getCurrentWeatherByCoordinates } from "../../services/external/weather.service.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const DEFAULT_NEARBY_RADIUS_KM = 100;
const MAX_NEARBY_RADIUS_KM = 500;
const EARTH_RADIUS_KM = 6371;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function parsePagination(query) {
  const page = Math.max(
    1,
    Number.parseInt(query.page) || 1
  );

  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(query.limit) || DEFAULT_PAGE_SIZE
    )
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

function buildObservatoryWhere(query = {}) {
  const where = {};

  if (query.isActive !== "false") {
    where.isActive = true;
  }

  if (query.city) {
    where.city = {
      contains: query.city,
      mode: "insensitive",
    };
  }

  if (query.province) {
    where.province = {
      contains: query.province,
      mode: "insensitive",
    };
  }

  if (query.country) {
    where.country = {
      contains: query.country,
      mode: "insensitive",
    };
  }

  if (query.isFeatured === "true") {
    where.isFeatured = true;
  }

  if (
    query.type &&
    Object.values(ObservatoryType).includes(
      query.type.toUpperCase()
    )
  ) {
    where.type = query.type.toUpperCase();
  }

  const minElevation = parseNumber(query.minElevation);
  const maxElevation = parseNumber(query.maxElevation);
  if (minElevation !== null || maxElevation !== null) {
    where.elevation = {};
    if (minElevation !== null) where.elevation.gte = minElevation;
    if (maxElevation !== null) where.elevation.lte = maxElevation;
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

function applyTextFilters(observatories, query = {}) {
  const equipment = parseCsv(query.equipment);

  return observatories.filter((obs) =>
    matchesSearch(obs, query.search) &&
    matchesEquipment(obs, equipment)
  );
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

async function getObservingCondition(obs) {
  try {
    const weather = await getCurrentWeatherByCoordinates(obs.latitude, obs.longitude);
    return scoreObservingCondition(weather, obs);
  } catch (error) {
    console.error("[observatory.service] Weather lookup failed:", error.message);
    return null;
  }
}

function formatObservatory(obs, distanceKm = null) {
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

/* -------------------------------------------------------------------------- */
/*                             Get All Observatories                          */
/* -------------------------------------------------------------------------- */

export async function getAllObservatories(query = {}) {
  const { page, limit, skip, take } =
    parsePagination(query);

  const where = buildObservatoryWhere(query);

  const allObservatories = await prisma.observatory.findMany({
    where,

    orderBy: [
      { isFeatured: "desc" },
      { rating: "desc" },
      { name: "asc" },
    ],
  });

  const filteredObservatories = applyTextFilters(allObservatories, query);

  const total = filteredObservatories.length;
  const observatories = filteredObservatories.slice(skip, skip + take);

  return {
    observatories: observatories.map((obs) =>
      formatObservatory(obs)
    ),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + take < total,
      hasPrev: page > 1,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                             Nearby Observatory                             */
/* -------------------------------------------------------------------------- */

export async function getNearbyObservatories(
  lat,
  lon,
  radiusKm = DEFAULT_NEARBY_RADIUS_KM,
  options = {}
) {
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new AppError(
      "lat and lon must be valid numbers",
      400
    );
  }

  if (lat < -90 || lat > 90) {
    throw new AppError(
      "Latitude must be between -90 and 90",
      400
    );
  }

  if (lon < -180 || lon > 180) {
    throw new AppError(
      "Longitude must be between -180 and 180",
      400
    );
  }

  const radius = Math.min(
    MAX_NEARBY_RADIUS_KM,
    Math.max(1, radiusKm)
  );

  const observatories = await prisma.observatory.findMany({
    where: {
      isActive: true,
    },

    orderBy: [
      { isFeatured: "desc" },
      { rating: "desc" },
      { name: "asc" },
    ],
  });

  const nearby = observatories
    .map((obs) => ({
      obs,
      distanceKm: Number(
        calculateDistanceKm(lat, lon, obs.latitude, obs.longitude).toFixed(2)
      ),
    }))
    .filter((item) => item.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Math.min(MAX_PAGE_SIZE, options.limit || 20));

  const results = await Promise.all(
    nearby.map(async ({ obs, distanceKm }) => {
      const formatted = formatObservatory(obs, distanceKm);
      if (!options.includeWeather) return formatted;

      return {
        ...formatted,
        observingCondition: await getObservingCondition(obs),
      };
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

/* -------------------------------------------------------------------------- */
/*                           Observatory Details                              */
/* -------------------------------------------------------------------------- */

export async function getObservatoryBySlug(
  slug,
  userId = null
) {
  const observatory =
    await prisma.observatory.findUnique({
      where: { slug },

      include: {
        _count: {
          select: {
            savedBy: true,
          },
        },
      },
    });

  if (!observatory) {
    throw new AppError(
      "Observatory not found",
      404
    );
  }

  let isSaved = false;

  if (userId) {
    const saved =
      await prisma.savedObservatory.findUnique({
        where: {
          userId_observatoryId: {
            userId,
            observatoryId: observatory.id,
          },
        },

        select: {
          id: true,
        },
      });

    isSaved = !!saved;
  }

  return {
    ...formatObservatory(observatory),
    observingCondition: await getObservingCondition(observatory),

    savedCount:
      observatory._count.savedBy,

    isSaved,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Save Observatory                              */
/* -------------------------------------------------------------------------- */

async function ensureObservatoryExists(observatoryId) {
  const observatory =
    await prisma.observatory.findUnique({
      where: {
        id: observatoryId,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!observatory) {
    throw new AppError(
      "Observatory not found",
      404
    );
  }

  return observatory;
}

export async function toggleSaveObservatory(
  observatoryId,
  userId
) {
  const observatory = await ensureObservatoryExists(observatoryId);

  const existing =
    await prisma.savedObservatory.findUnique({
      where: {
        userId_observatoryId: {
          userId,
          observatoryId,
        },
      },
    });

  if (existing) {
    await prisma.savedObservatory.delete({
      where: {
        userId_observatoryId: {
          userId,
          observatoryId,
        },
      },
    });

    return {
      saved: false,
      observatoryName: observatory.name,
    };
  }

  await prisma.savedObservatory.create({
    data: {
      userId,
      observatoryId,
    },
  });

  return {
    saved: true,
    observatoryName: observatory.name,
  };
}

export async function removeSavedObservatory(
  observatoryId,
  userId
) {
  const observatory = await ensureObservatoryExists(observatoryId);

  await prisma.savedObservatory.deleteMany({
    where: {
      userId,
      observatoryId,
    },
  });

  return {
    saved: false,
    observatoryName: observatory.name,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Observatory Stats                             */
/* -------------------------------------------------------------------------- */

export async function getObservatoryStats(query = {}, userId = null) {
  const where = buildObservatoryWhere(query);

  const [allObservatories, savedCount] = await Promise.all([
    prisma.observatory.findMany({
      where,
    }),
    userId
      ? prisma.savedObservatory.count({ where: { userId } })
      : Promise.resolve(0),
  ]);

  const observatories = applyTextFilters(allObservatories, query);
  const total = observatories.length;
  const featured = observatories.filter((obs) => obs.isFeatured).length;

  const numericAverage = (key) => {
    const values = observatories
      .map((obs) => obs[key])
      .filter((value) => value !== null && value !== undefined);

    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const byType = observatories.reduce((acc, obs) => {
    acc[obs.type] = (acc[obs.type] || 0) + 1;
    return acc;
  }, {});

  const avgSkyQuality = numericAverage("skyQualityScore");
  const avgLightPollution = numericAverage("lightPollutionScore");
  const avgElevation = numericAverage("elevation");

  return {
    total,
    featured,
    savedCount,
    averages: {
      skyQualityScore: avgSkyQuality
        ? Number(avgSkyQuality.toFixed(1))
        : null,
      lightPollutionScore: avgLightPollution
        ? Number(avgLightPollution.toFixed(1))
        : null,
      elevation: avgElevation
        ? Number(avgElevation.toFixed(0))
        : null,
    },
    byType,
  };
}
