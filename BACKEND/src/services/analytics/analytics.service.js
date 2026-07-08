import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.util.js";

const DEFAULT_DAYS = 7;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const VALID_ANALYTICS_EVENTS = new Set([
  "PAGE_VIEW",
  "PLANET_VIEW",
  "CONSTELLATION_VIEW",
  "CHATBOT_MESSAGE",
  "NEWS_VIEW",
  "RECOMMENDATION_REQUEST",
  "OBSERVATORY_VIEW",
  "IMAGE_UPLOAD",
  "SEARCH",
]);

function clampPositiveInt(value, fallback = DEFAULT_LIMIT, max = MAX_LIMIT) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function getDateWindow(days = DEFAULT_DAYS) {
  const safeDays = clampPositiveInt(days, DEFAULT_DAYS, 365);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - safeDays);
  return { days: safeDays, fromDate };
}

function dateKey(date) {
  return date.toISOString().split("T")[0];
}

function groupByDay(rows, dateField = "createdAt") {
  const grouped = new Map();

  for (const row of rows) {
    const key = dateKey(row[dateField]);
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return Array.from(grouped.entries()).map(([date, count]) => ({ date, count }));
}

function getRequestIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

export async function trackAnalyticsEvent({
  userId = null,
  event,
  entityType = null,
  entityId = null,
  entityName = null,
  metadata = {},
  req = null,
}) {
  if (!VALID_ANALYTICS_EVENTS.has(event)) {
    throw new AppError(`Invalid analytics event: ${event}`, 400);
  }

  return prisma.analytics.create({
    data: {
      userId,
      event,
      entityType,
      entityId,
      entityName,
      ipAddress: req ? getRequestIp(req) : null,
      userAgent: req?.headers?.["user-agent"] || null,
      referrer: req?.headers?.referer || req?.headers?.referrer || null,
      metadata,
    },
  });
}

export async function getOverviewStats({ days = DEFAULT_DAYS } = {}) {
  const { fromDate } = getDateWindow(days);

  const [
    totalUsers,
    totalPlanets,
    totalConstellations,
    totalObservatories,
    totalNewsArticles,
    totalChatMessages,
    totalRecommendations,
    totalImageUploads,
    totalAnalyticsEvents,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.planet.count({ where: { isVisible: true } }),
    prisma.constellation.count({ where: { isVisible: true } }),
    prisma.observatory.count({ where: { isActive: true } }),
    prisma.newsArticle.count(),
    prisma.chatMessage.count(),
    prisma.recommendation.count(),
    prisma.imageUpload.count(),
    prisma.analytics.count({ where: { createdAt: { gte: fromDate } } }),
    prisma.analytics.findMany({
      where: {
        createdAt: { gte: fromDate },
        userId: { not: null },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  return {
    totalUsers,
    totalPlanets,
    totalConstellations,
    totalObservatories,
    totalNewsArticles,
    totalChatMessages,
    totalRecommendations,
    totalImageUploads,
    totalAnalyticsEvents,
    activeUsers: activeUsers.length,
  };
}

export async function getUserGrowthStats({ days = DEFAULT_DAYS } = {}) {
  const { fromDate } = getDateWindow(days);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: fromDate } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return groupByDay(users);
}

export async function getChatAnalytics({ days = DEFAULT_DAYS } = {}) {
  const { fromDate } = getDateWindow(days);
  const messages = await prisma.chatMessage.findMany({
    where: { createdAt: { gte: fromDate } },
    select: { role: true, intent: true, tokensUsed: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDate = new Map();
  const byIntent = {};
  let userMessages = 0;
  let assistantMessages = 0;
  let tokensUsed = 0;

  for (const message of messages) {
    const key = dateKey(message.createdAt);
    if (!byDate.has(key)) byDate.set(key, { date: key, total: 0, user: 0, assistant: 0 });

    const row = byDate.get(key);
    row.total += 1;

    if (message.role === "user") {
      userMessages += 1;
      row.user += 1;
    }

    if (message.role === "assistant") {
      assistantMessages += 1;
      row.assistant += 1;
    }

    byIntent[message.intent] = (byIntent[message.intent] || 0) + 1;
    tokensUsed += message.tokensUsed || 0;
  }

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    tokensUsed,
    messagesByDate: Array.from(byDate.values()),
    intents: Object.entries(byIntent)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getPopularSections({ days = DEFAULT_DAYS, limit = DEFAULT_LIMIT } = {}) {
  const { fromDate } = getDateWindow(days);
  const safeLimit = clampPositiveInt(limit);

  const events = await prisma.analytics.groupBy({
    by: ["event"],
    where: { createdAt: { gte: fromDate } },
    _count: { event: true },
    orderBy: { _count: { event: "desc" } },
    take: safeLimit,
  });

  return events.map((row) => ({
    event: row.event,
    count: row._count.event,
  }));
}

export async function getPopularEntities({ days = DEFAULT_DAYS, limit = DEFAULT_LIMIT } = {}) {
  const { fromDate } = getDateWindow(days);
  const safeLimit = clampPositiveInt(limit);

  const rows = await prisma.analytics.groupBy({
    by: ["entityType", "entityId", "entityName"],
    where: {
      createdAt: { gte: fromDate },
      entityType: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: safeLimit,
  });

  return rows.map((row) => ({
    entityType: row.entityType,
    entityId: row.entityId,
    entityName: row.entityName,
    count: row._count.id,
  }));
}

export async function getRecentActivities({ limit = DEFAULT_LIMIT } = {}) {
  const safeLimit = clampPositiveInt(limit);

  const [analyticsRows, recentUsers, recentUploads, recentRecommendations] = await Promise.all([
    prisma.analytics.findMany({
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      take: Math.ceil(safeLimit / 2),
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, username: true, displayName: true, createdAt: true },
    }),
    prisma.imageUpload.findMany({
      take: Math.ceil(safeLimit / 2),
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, recognizedConstellation: true, createdAt: true },
    }),
    prisma.recommendation.findMany({
      take: Math.ceil(safeLimit / 2),
      orderBy: { createdAt: "desc" },
      select: { id: true, locationName: true, skyVisibilityScore: true, createdAt: true },
    }),
  ]);

  const activities = [
    ...analyticsRows.map((row) => ({
      type: row.event,
      title: row.entityName || row.event.replaceAll("_", " ").toLowerCase(),
      description: row.user?.displayName || row.user?.username || row.user?.email || "Anonymous visitor",
      createdAt: row.createdAt,
    })),
    ...recentUsers.map((user) => ({
      type: "USER_REGISTERED",
      title: "New user registered",
      description: user.displayName || user.username || user.email,
      createdAt: user.createdAt,
    })),
    ...recentUploads.map((upload) => ({
      type: "IMAGE_UPLOAD",
      title: upload.recognizedConstellation || "Constellation image uploaded",
      description: upload.fileName,
      createdAt: upload.createdAt,
    })),
    ...recentRecommendations.map((recommendation) => ({
      type: "RECOMMENDATION_REQUEST",
      title: recommendation.locationName || "Stargazing recommendation",
      description: recommendation.skyVisibilityScore != null
        ? `Sky score ${recommendation.skyVisibilityScore}/100`
        : "Recommendation generated",
      createdAt: recommendation.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, safeLimit);
}

export async function getContentRecommendations({ userId, limit = 5 } = {}) {
  const safeLimit = clampPositiveInt(limit, 5, 12);

  if (!userId) {
    const [planets, constellations, news] = await Promise.all([
      prisma.planet.findMany({ where: { isVisible: true }, take: 2, orderBy: { distanceFromSunAu: "asc" } }),
      prisma.constellation.findMany({ where: { isVisible: true }, take: 2, orderBy: { name: "asc" } }),
      prisma.newsArticle.findMany({ take: 1, orderBy: { publishedAt: "desc" } }),
    ]);

    return [...planets, ...constellations, ...news].slice(0, safeLimit);
  }

  const recentEvents = await prisma.analytics.findMany({
    where: { userId },
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { event: true, entityType: true, entityName: true, metadata: true },
  });

  const wantsPlanets = recentEvents.some((event) => event.event === "PLANET_VIEW");
  const wantsConstellations = recentEvents.some((event) => event.event === "CONSTELLATION_VIEW" || event.event === "IMAGE_UPLOAD");

  const [planets, constellations, observatories, news] = await Promise.all([
    wantsPlanets
      ? prisma.planet.findMany({ where: { isVisible: true }, take: 3, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    wantsConstellations
      ? prisma.constellation.findMany({ where: { isVisible: true }, take: 3, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.observatory.findMany({ where: { isActive: true, isFeatured: true }, take: 2, orderBy: { rating: "desc" } }),
    prisma.newsArticle.findMany({ take: 2, orderBy: { publishedAt: "desc" } }),
  ]);

  return [...planets, ...constellations, ...observatories, ...news].slice(0, safeLimit);
}

export async function getDashboardAnalytics({ days = DEFAULT_DAYS, limit = DEFAULT_LIMIT, userId = null } = {}) {
  const safeDays = clampPositiveInt(days, DEFAULT_DAYS, 365);
  const safeLimit = clampPositiveInt(limit);

  const [
    overview,
    userGrowth,
    chatAnalytics,
    popularSections,
    popularEntities,
    recentActivities,
    recommendations,
  ] = await Promise.all([
    getOverviewStats({ days: safeDays }),
    getUserGrowthStats({ days: safeDays }),
    getChatAnalytics({ days: safeDays }),
    getPopularSections({ days: safeDays, limit: safeLimit }),
    getPopularEntities({ days: safeDays, limit: safeLimit }),
    getRecentActivities({ limit: safeLimit }),
    getContentRecommendations({ userId, limit: safeLimit }),
  ]);

  return {
    window: { days: safeDays },
    overview,
    userGrowth,
    chatAnalytics,
    popularSections,
    popularEntities,
    recentActivities,
    recommendations,
  };
}
