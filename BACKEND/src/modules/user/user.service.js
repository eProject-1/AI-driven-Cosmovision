import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

function clampLimit(value, fallback = 10, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function toUserResponse(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    name: user.displayName || user.username,
    avatarUrl: user.avatarUrl,
    role: user.role,
    provider: user.provider,
    isVerified: user.isVerified,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    profile: user.profile || null,
    preferences: user.preferences || null,
  };
}

export async function getCurrentUser(userId) {
  if (!userId) throw new AppError("User authentication is required", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preferences: true,
    },
  });

  if (!user) throw new AppError("User not found", 404);

  return toUserResponse(user);
}

export async function updateUserProfile(userId, payload) {
  if (!userId) throw new AppError("User authentication is required", 401);

  const { displayName, avatarUrl, ...profileData } = payload;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });

  if (!user) throw new AppError("User not found", 404);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      profile: {
        upsert: {
          create: {
            bio: profileData.bio ?? null,
            location: profileData.location ?? null,
            latitude: profileData.latitude ?? null,
            longitude: profileData.longitude ?? null,
            timezone: profileData.timezone || "UTC",
            website: profileData.website ?? null,
          },
          update: {
            ...profileData,
          },
        },
      },
    },
    include: {
      profile: true,
      preferences: true,
    },
  });

  return toUserResponse(updatedUser);
}

export async function updateUserPreferences(userId, payload) {
  if (!userId) throw new AppError("User authentication is required", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new AppError("User not found", 404);

  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      ...payload,
    },
    update: {
      ...payload,
    },
  });

  return preferences;
}

async function ensurePreference(userId) {
  return prisma.userPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

function getFavoriteField(type) {
  if (type === "planets") return "favoritesPlanets";
  if (type === "constellations") return "favoritesConstellations";
  throw new AppError("Favorite type must be planets or constellations", 400);
}

async function resolveFavoriteName(type, slugOrName) {
  const cleanValue = String(slugOrName || "").trim();
  if (!cleanValue) throw new AppError("Favorite value is required", 400);

  if (type === "planets") {
    const planet = await prisma.planet.findFirst({
      where: {
        OR: [
          { slug: { equals: cleanValue, mode: "insensitive" } },
          { name: { equals: cleanValue, mode: "insensitive" } },
        ],
      },
      select: { name: true },
    });

    if (!planet) throw new AppError("Planet not found", 404);
    return planet.name;
  }

  const constellation = await prisma.constellation.findFirst({
    where: {
      OR: [
        { slug: { equals: cleanValue, mode: "insensitive" } },
        { name: { equals: cleanValue, mode: "insensitive" } },
      ],
    },
    select: { name: true },
  });

  if (!constellation) throw new AppError("Constellation not found", 404);
  return constellation.name;
}

export async function addFavorite(userId, type, slugOrName) {
  if (!userId) throw new AppError("User authentication is required", 401);

  const field = getFavoriteField(type);
  const favoriteName = await resolveFavoriteName(type, slugOrName);
  const preferences = await ensurePreference(userId);
  const nextValues = Array.from(new Set([...(preferences[field] || []), favoriteName]));

  return prisma.userPreference.update({
    where: { userId },
    data: { [field]: nextValues },
  });
}

export async function removeFavorite(userId, type, slugOrName) {
  if (!userId) throw new AppError("User authentication is required", 401);

  const field = getFavoriteField(type);
  const favoriteName = await resolveFavoriteName(type, slugOrName);
  const preferences = await ensurePreference(userId);
  const nextValues = (preferences[field] || []).filter(
    (value) => value.toLowerCase() !== favoriteName.toLowerCase()
  );

  return prisma.userPreference.update({
    where: { userId },
    data: { [field]: nextValues },
  });
}

export async function getUserRecommendations(userId, limit = 10) {
  if (!userId) throw new AppError("User authentication is required", 401);

  return prisma.recommendation.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
    take: clampLimit(limit),
  });
}

export async function getSavedEvents(userId) {
  if (!userId) throw new AppError("User authentication is required", 401);

  return prisma.savedEvent.findMany({
    where: { userId },
    include: {
      event: true,
    },
    orderBy: {
      savedAt: "desc",
    },
  });
}

export async function saveEvent(userId, eventId) {
  if (!userId) throw new AppError("User authentication is required", 401);
  if (!eventId) throw new AppError("eventId is required", 400);

  const event = await prisma.celestialEvent.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!event) throw new AppError("Celestial event not found", 404);

  return prisma.savedEvent.upsert({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
    create: {
      userId,
      eventId,
    },
    update: {},
    include: {
      event: true,
    },
  });
}

export async function removeSavedEvent(userId, eventId) {
  if (!userId) throw new AppError("User authentication is required", 401);
  if (!eventId) throw new AppError("eventId is required", 400);

  await prisma.savedEvent.deleteMany({
    where: {
      userId,
      eventId,
    },
  });

  return { saved: false, eventId };
}

export async function getSavedObservatories(userId) {
  if (!userId) throw new AppError("User authentication is required", 401);

  return prisma.savedObservatory.findMany({
    where: { userId },
    include: {
      observatory: true,
    },
    orderBy: {
      savedAt: "desc",
    },
  });
}

export async function getUserImageUploads(userId, limit = 10) {
  if (!userId) throw new AppError("User authentication is required", 401);

  return prisma.imageUpload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: clampLimit(limit),
    include: {
      constellation: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          mapUrl: true,
        },
      },
    },
  });
}

export async function getUserSummary(userId) {
  if (!userId) throw new AppError("User authentication is required", 401);

  const [
    user,
    recommendationCount,
    savedEventCount,
    savedObservatoryCount,
    imageUploadCount,
    latestRecommendations,
    latestUploads,
  ] = await Promise.all([
    getCurrentUser(userId),
    prisma.recommendation.count({ where: { userId } }),
    prisma.savedEvent.count({ where: { userId } }),
    prisma.savedObservatory.count({ where: { userId } }),
    prisma.imageUpload.count({ where: { userId } }),
    prisma.recommendation.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: 3,
    }),
    getUserImageUploads(userId, 3),
  ]);

  return {
    user,
    counts: {
      recommendations: recommendationCount,
      savedEvents: savedEventCount,
      savedObservatories: savedObservatoryCount,
      imageUploads: imageUploadCount,
      favoritePlanets: user.preferences?.favoritesPlanets?.length || 0,
      favoriteConstellations: user.preferences?.favoritesConstellations?.length || 0,
    },
    latestRecommendations,
    latestUploads,
  };
}
