import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
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
  const limit = clampLimit(options.limit);

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
    .slice(0, limit);

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
