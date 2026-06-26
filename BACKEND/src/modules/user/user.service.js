import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

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

export async function getUserRecommendations(userId, limit = 10) {
  if (!userId) throw new AppError("User authentication is required", 401);

  return prisma.recommendation.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
    take: Number(limit),
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