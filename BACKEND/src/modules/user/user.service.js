import prisma from "../../config/db.js";
import { AppError } from "../../utils/app.error.util.js";
import { clampInteger, requireUserId } from "../../utils/service.util.js";

export async function getCurrentUser(userId) {
  requireUserId(userId);

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
  requireUserId(userId);

  const { displayName, avatarUrl, ...profileData } = payload;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
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
          update: profileData,
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
  requireUserId(userId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  return prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      ...payload,
    },
    update: payload,
  });
}

export async function addFavorite(userId, type, slugOrName) {
  requireUserId(userId);

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
  requireUserId(userId);

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
  requireUserId(userId);

  return prisma.recommendation.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
    take: clampInteger(limit),
  });
}

export async function getSavedEvents(userId) {
  requireUserId(userId);

  return prisma.savedEvent.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { savedAt: "desc" },
  });
}

export async function saveEvent(userId, eventId) {
  requireUserId(userId);
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
    include: { event: true },
  });
}

export async function removeSavedEvent(userId, eventId) {
  requireUserId(userId);
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
  requireUserId(userId);

  return prisma.savedObservatory.findMany({
    where: { userId },
    include: { observatory: true },
    orderBy: { savedAt: "desc" },
  });
}

export async function getUserImageUploads(userId, limit = 10) {
  requireUserId(userId);

  return prisma.imageUpload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: clampInteger(limit),
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
  requireUserId(userId);

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

  const model = type === "planets" ? prisma.planet : prisma.constellation;
  const entityName = type === "planets" ? "Planet" : "Constellation";
  const entity = await model.findFirst({
    where: {
      OR: [
        { slug: { equals: cleanValue, mode: "insensitive" } },
        { name: { equals: cleanValue, mode: "insensitive" } },
      ],
    },
    select: { name: true },
  });

  if (!entity) throw new AppError(`${entityName} not found`, 404);
  return entity.name;
}
