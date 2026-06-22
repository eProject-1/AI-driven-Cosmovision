import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { ObservatoryType } from "@prisma/client";

import {
  findNearbyObservatories,
} from "../../services/external/maps.service.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const DEFAULT_NEARBY_RADIUS_KM = 100;
const MAX_NEARBY_RADIUS_KM = 500;

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

function formatObservatory(obs, distanceKm = null) {
  return {
    id: obs.id,
    name: obs.name,
    slug: obs.slug,
    description: obs.description,

    type: obs.type,

    imageUrl: obs.imageUrl,

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

  const [total, observatories] =
    await Promise.all([
      prisma.observatory.count({
        where,
      }),

      prisma.observatory.findMany({
        where,

        orderBy: [
          { isFeatured: "desc" },
          { rating: "desc" },
          { name: "asc" },
        ],

        skip,
        take,
      }),
    ]);

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
  radiusKm = DEFAULT_NEARBY_RADIUS_KM
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

  const osmResults =
    await findNearbyObservatories(
      lat,
      lon,
      radius
    );

  const results = osmResults.map((osm) => ({
    osmId: osm.id,

    name: osm.name,

    latitude: osm.lat,
    longitude: osm.lon,

    distanceKm: osm.distanceKm,

    type: osm.type,

    address: osm.address ?? null,
    website: osm.website ?? null,
    phone: osm.phone ?? null,
    openingHours: osm.openingHours ?? null,

    source: "osm",
  }));

  return {
    results,

    meta: {
      lat,
      lon,
      radiusKm: radius,
      total: results.length,
      source: "openstreetmap_overpass",
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

    savedCount:
      observatory._count.savedBy,

    isSaved,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Save Observatory                              */
/* -------------------------------------------------------------------------- */

export async function toggleSaveObservatory(
  observatoryId,
  userId
) {
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