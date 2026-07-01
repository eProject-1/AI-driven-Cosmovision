import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
export {
  answerNewsQuestion,
  explainNewsArticle,
  generateNewsAiCategory,
  generateNewsAiSummary,
  generateNewsAiTags,
  generateNewsImportance,
  summarizeNewsArticle,
} from "./news-ai.service.js";

import {
  fetchAstronomyNews,
  fetchNasaNews,
  fetchExoplanetNews,
} from "../../services/external/news.service.js";

let maintenanceTimer = null;

function clampLimit(value, fallback = 10, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapArticleCategory(article) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (text.includes("nasa") || text.includes("mission") || text.includes("spaceflight")) {
    return "SPACE_EXPLORATION";
  }

  if (text.includes("planet") || text.includes("mars") || text.includes("jupiter") || text.includes("solar system")) {
    return "SOLAR_SYSTEM";
  }

  if (text.includes("galaxy") || text.includes("black hole") || text.includes("exoplanet") || text.includes("deep space")) {
    return "DEEP_SPACE";
  }

  if (text.includes("telescope") || text.includes("rocket") || text.includes("technology")) {
    return "TECHNOLOGY";
  }

  return "GENERAL";
}

function buildTags(article) {
  const tags = new Set();
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  const candidates = [
    "NASA",
    "Mars",
    "Moon",
    "Exoplanet",
    "Galaxy",
    "Telescope",
    "Rocket",
    "SpaceX",
    "Artemis",
    "James Webb",
    "Astronomy",
  ];

  for (const tag of candidates) {
    if (text.includes(tag.toLowerCase())) tags.add(tag);
  }

  return Array.from(tags);
}

async function generateUniqueSlug(title) {
  const baseSlug = slugify(title || "news-article") || "news-article";
  let slug = baseSlug;
  let index = 1;

  while (await prisma.newsArticle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${index}`;
    index++;
  }

  return slug;
}

async function upsertExternalArticle(article) {
  const sourceUrl = article.url || article.sourceUrl || null;

  if (!sourceUrl || !article.title) {
    return null;
  }

  const existing = await prisma.newsArticle.findFirst({
    where: { sourceUrl },
  });

  if (existing) {
    return existing;
  }

  const slug = await generateUniqueSlug(article.title);
  const publishedAt = article.publishedAt || article.published_at;

  return prisma.newsArticle.create({
    data: {
      title: article.title,
      slug,
      source: article.source || article.news_site || "Spaceflight News",
      sourceUrl,
      imageUrl: article.imageUrl || article.image_url || null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      category: mapArticleCategory(article),
      summary: article.summary || article.description || article.content || null,
      tags: buildTags(article),
      fetchedAt: new Date(),
    },
  });
}

export async function getNewsList({ page = 1, limit = 10, category, search } = {}) {
  const safePage = clampLimit(page, 1, 10_000);
  const safeLimit = clampLimit(limit);
  const skip = (safePage - 1) * safeLimit;

  const where = {
    ...(category && { category }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function cleanupOldNews({ retentionDays = env.NEWS_RETENTION_DAYS } = {}) {
  const days = Number(retentionDays) || env.NEWS_RETENTION_DAYS;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await prisma.newsArticle.deleteMany({
    where: {
      publishedAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    deleted: result.count,
    retentionDays: days,
    cutoffDate,
  };
}

export async function runNewsMaintenance({
  query = "space",
  pageSize = 20,
  retentionDays = env.NEWS_RETENTION_DAYS,
} = {}) {
  const [fetchOutcome, cleanupOutcome] = await Promise.allSettled([
    fetchLatestNews({ query, pageSize }),
    cleanupOldNews({ retentionDays }),
  ]);

  const fetchResult =
    fetchOutcome.status === "fulfilled"
      ? fetchOutcome.value
      : { fetched: 0, saved: 0, error: fetchOutcome.reason?.message || "Fetch failed" };

const cleanupResult =
    cleanupOutcome.status === "fulfilled"
      ? cleanupOutcome.value
      : {
          deleted: 0,
          retentionDays,
          cutoffDate: null,
          error: cleanupOutcome.reason?.message || "Cleanup failed",
        };

  return {
    fetched: fetchResult.fetched,
    saved: fetchResult.saved,
    fetchError: fetchResult.error || null,
    deleted: cleanupResult.deleted,
    retentionDays: cleanupResult.retentionDays,
    cutoffDate: cleanupResult.cutoffDate,
    cleanupError: cleanupResult.error || null,
  };
}

export function startNewsMaintenanceJob() {
  if (!env.NEWS_AUTO_FETCH_ENABLED || maintenanceTimer) return maintenanceTimer;

  const intervalMs = Math.max(5, env.NEWS_AUTO_FETCH_INTERVAL_MINUTES) * 60 * 1000;

  const runSafely = async (reason) => {
    try {
      const result = await runNewsMaintenance();
      console.log(
        `[news] maintenance ${reason}: fetched=${result.fetched}, saved=${result.saved}, deleted=${result.deleted}`
      );
    } catch (error) {
      console.error("[news] maintenance failed:", error.message);
    }
  };

  const startupTimer = setTimeout(() => runSafely("startup"), 5000);
  if (typeof startupTimer.unref === "function") startupTimer.unref();

  maintenanceTimer = setInterval(() => runSafely("interval"), intervalMs);
  if (typeof maintenanceTimer.unref === "function") maintenanceTimer.unref();

  return maintenanceTimer;
}

export async function getNewsBySlug(slug) {
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
  });

  if (!article) throw new AppError("News article not found", 404);

  return article;
}

export async function fetchLatestNews({ query, pageSize = 10 } = {}) {
  const safePageSize = clampLimit(pageSize);
  const result = await fetchAstronomyNews({
    query,
    pageSize: safePageSize,
    page: 1,
    language: "en",
    sortBy: "publishedAt",
  });

  if (!result.success) {
    throw new AppError(result.message || "Failed to fetch external news", 502);
  }

  const savedArticles = [];

  for (const article of result.data) {
    const saved = await upsertExternalArticle(article);
    if (saved) savedArticles.push(saved);
  }

  return {
    fetched: result.count,
    saved: savedArticles.length,
    articles: savedArticles,
  };
}

export async function fetchLatestNasaNews({ pageSize = 10 } = {}) {
  const result = await fetchNasaNews({ pageSize: clampLimit(pageSize), page: 1 });

  if (!result.success) {
    throw new AppError(result.message || "Failed to fetch NASA news", 502);
  }

  const savedArticles = [];

  for (const article of result.data) {
    const saved = await upsertExternalArticle(article);
    if (saved) savedArticles.push(saved);
  }

  return {
    fetched: result.count,
    saved: savedArticles.length,
    articles: savedArticles,
  };
}

export async function fetchLatestExoplanetNews({ pageSize = 10 } = {}) {
  const result = await fetchExoplanetNews({ pageSize: clampLimit(pageSize), page: 1 });

  if (!result.success) {
    throw new AppError(result.message || "Failed to fetch exoplanet news", 502);
  }

  const savedArticles = [];

  for (const article of result.data) {
    const saved = await upsertExternalArticle(article);
    if (saved) savedArticles.push(saved);
  }

  return {
    fetched: result.count,
    saved: savedArticles.length,
    articles: savedArticles,
  };
}

export async function getDashboardNewsHighlights(limit = 5) {
  const safeLimit = clampLimit(limit, 5);
  return prisma.newsArticle.findMany({
    orderBy: { publishedAt: "desc" },
    take: safeLimit,
    select: {
      id: true,
      title: true,
      slug: true,
      source: true,
      sourceUrl: true,
      imageUrl: true,
      publishedAt: true,
      category: true,
      summary: true,
      aiSummary: true,
      importance: true,
      aiCategory: true,
      tags: true,
    },
  });
}
