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

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const activityStart = new Date(now);
  activityStart.setDate(activityStart.getDate() - 29);
  activityStart.setHours(0, 0, 0, 0);

  const [
    user,
    recommendationCount,
    savedEventCount,
    savedObservatoryCount,
    imageUploadCount,
    weeklyRecommendationCount,
    weeklySavedEventCount,
    weeklySavedObservatoryCount,
    weeklyImageUploadCount,
    latestRecommendations,
    latestUploads,
    activityRecommendations,
    activitySavedEvents,
    activitySavedObservatories,
    activityImageUploads,
    categoryRecommendations,
  ] = await Promise.all([
    getCurrentUser(userId),
    prisma.recommendation.count({ where: { userId } }),
    prisma.savedEvent.count({ where: { userId } }),
    prisma.savedObservatory.count({ where: { userId } }),
    prisma.imageUpload.count({ where: { userId } }),
    prisma.recommendation.count({ where: { userId, requestedAt: { gte: weekStart } } }),
    prisma.savedEvent.count({ where: { userId, savedAt: { gte: weekStart } } }),
    prisma.savedObservatory.count({ where: { userId, savedAt: { gte: weekStart } } }),
    prisma.imageUpload.count({ where: { userId, createdAt: { gte: weekStart } } }),
    prisma.recommendation.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: 3,
    }),
    getUserImageUploads(userId, 3),
    prisma.recommendation.findMany({
      where: { userId, requestedAt: { gte: activityStart } },
      select: { requestedAt: true },
    }),
    prisma.savedEvent.findMany({
      where: { userId, savedAt: { gte: activityStart } },
      select: { savedAt: true },
    }),
    prisma.savedObservatory.findMany({
      where: { userId, savedAt: { gte: activityStart } },
      select: { savedAt: true },
    }),
    prisma.imageUpload.findMany({
      where: { userId, createdAt: { gte: activityStart } },
      select: { createdAt: true },
    }),
    prisma.recommendation.findMany({
      where: { userId },
      select: {
        visiblePlanets: true,
        visibleConstellations: true,
        nearbyObservatories: true,
      },
    }),
  ]);

  const savedItemCount = savedEventCount + savedObservatoryCount;
  const weeklySavedItemCount = weeklySavedEventCount + weeklySavedObservatoryCount;
  const contributionCount = recommendationCount + imageUploadCount;
  const weeklyContributionCount = weeklyRecommendationCount + weeklyImageUploadCount;
  const categoryScores = buildTopCategories({
    categoryRecommendations,
    favoritePlanets: user.preferences?.favoritesPlanets || [],
    favoriteConstellations: user.preferences?.favoritesConstellations || [],
    imageUploadCount,
    savedEventCount,
    savedObservatoryCount,
  });

  return {
    user,
    counts: {
      recommendations: recommendationCount,
      savedEvents: savedEventCount,
      savedObservatories: savedObservatoryCount,
      savedItems: savedItemCount,
      imageUploads: imageUploadCount,
      contributions: contributionCount,
      favoritePlanets: user.preferences?.favoritesPlanets?.length || 0,
      favoriteConstellations: user.preferences?.favoritesConstellations?.length || 0,
    },
    weeklyCounts: {
      recommendations: weeklyRecommendationCount,
      savedEvents: weeklySavedEventCount,
      savedObservatories: weeklySavedObservatoryCount,
      savedItems: weeklySavedItemCount,
      imageUploads: weeklyImageUploadCount,
      contributions: weeklyContributionCount,
    },
    activity: buildActivitySeries({
      startDate: activityStart,
      days: 30,
      events: [
        ...activityRecommendations.map((item) => ({ date: item.requestedAt, type: "recommendation" })),
        ...activitySavedEvents.map((item) => ({ date: item.savedAt, type: "saved_event" })),
        ...activitySavedObservatories.map((item) => ({ date: item.savedAt, type: "saved_observatory" })),
        ...activityImageUploads.map((item) => ({ date: item.createdAt, type: "image_upload" })),
      ],
    }),
    topCategories: categoryScores,
    latestRecommendations,
    latestUploads,
  };
}

function buildActivitySeries({ startDate, days, events }) {
  const dayMs = 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate.getTime() + index * dayMs);
    return {
      date: date.toISOString().slice(0, 10),
      total: 0,
      recommendation: 0,
      saved_event: 0,
      saved_observatory: 0,
      image_upload: 0,
    };
  });
  const byDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  for (const event of events) {
    const dateKey = new Date(event.date).toISOString().slice(0, 10);
    const bucket = byDate.get(dateKey);
    if (!bucket) continue;
    bucket.total += 1;
    bucket[event.type] = (bucket[event.type] || 0) + 1;
  }

  return buckets;
}

function buildTopCategories({
  categoryRecommendations,
  favoritePlanets,
  favoriteConstellations,
  imageUploadCount,
  savedEventCount,
  savedObservatoryCount,
}) {
  const planetScore =
    favoritePlanets.length +
    categoryRecommendations.reduce((total, item) => total + (item.visiblePlanets?.length || 0), 0);
  const constellationScore =
    favoriteConstellations.length +
    imageUploadCount +
    categoryRecommendations.reduce((total, item) => total + (item.visibleConstellations?.length || 0), 0);
  const observatoryScore =
    savedObservatoryCount +
    categoryRecommendations.reduce((total, item) => total + (item.nearbyObservatories?.length || 0), 0);
  const eventScore = savedEventCount;

  const rawCategories = [
    { label: "Planets", icon: "Orbit", count: planetScore },
    { label: "Constellations", icon: "Stars", count: constellationScore },
    { label: "Observatory", icon: "Scope", count: observatoryScore },
    { label: "Celestial Events", icon: "Event", count: eventScore },
  ];
  const total = rawCategories.reduce((sum, item) => sum + item.count, 0);

  return rawCategories.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
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
