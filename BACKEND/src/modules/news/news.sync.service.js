import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { clampInteger } from "../../utils/service.util.js";
import {
  fetchAstronomyNews,
  fetchExoplanetNews,
  fetchNasaNews,
} from "../../services/external/news.service.js";
import { upsertExternalArticle } from "./news.article.service.js";

let maintenanceTimer = null;
const logger = createLogger("news");

export async function fetchLatestNews({ query, pageSize = 10 } = {}) {
  return fetchAndSaveExternalNews(
    fetchAstronomyNews,
    {
      query,
      pageSize: clampInteger(pageSize),
      page: 1,
    },
    "Failed to fetch external news"
  );
}

export async function fetchLatestNasaNews({ pageSize = 10 } = {}) {
  return fetchAndSaveExternalNews(
    fetchNasaNews,
    { pageSize: clampInteger(pageSize), page: 1 },
    "Failed to fetch NASA news"
  );
}

export async function fetchLatestExoplanetNews({ pageSize = 10 } = {}) {
  return fetchAndSaveExternalNews(
    fetchExoplanetNews,
    { pageSize: clampInteger(pageSize), page: 1 },
    "Failed to fetch exoplanet news"
  );
}

export async function cleanupOldNews({ retentionDays = env.NEWS_RETENTION_DAYS } = {}) {
  const days = Number(retentionDays) || env.NEWS_RETENTION_DAYS;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.newsArticle.deleteMany({
    where: {
      publishedAt: { lt: cutoffDate },
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
  const fetchResult = unwrapMaintenanceOutcome(fetchOutcome, { fetched: 0, saved: 0 }, "Fetch failed");
  const cleanupResult = unwrapMaintenanceOutcome(
    cleanupOutcome,
    { deleted: 0, retentionDays, cutoffDate: null },
    "Cleanup failed"
  );

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
  const startupTimer = setTimeout(() => runMaintenanceSafely("startup"), 5000);
  if (typeof startupTimer.unref === "function") startupTimer.unref();

  maintenanceTimer = setInterval(() => runMaintenanceSafely("interval"), intervalMs);
  if (typeof maintenanceTimer.unref === "function") maintenanceTimer.unref();

  return maintenanceTimer;
}

async function fetchAndSaveExternalNews(fetcher, params, fallbackMessage) {
  const result = await fetcher(params);
  if (!result.success) throw new AppError(result.message || fallbackMessage, 502);

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

function unwrapMaintenanceOutcome(outcome, fallback, errorMessage) {
  return outcome.status === "fulfilled"
    ? outcome.value
    : { ...fallback, error: outcome.reason?.message || errorMessage };
}

async function runMaintenanceSafely(reason) {
  try {
    const result = await runNewsMaintenance();
    logger.info(`maintenance ${reason}`, {
      fetched: result.fetched,
      saved: result.saved,
      deleted: result.deleted,
    });
  } catch (error) {
    logger.error("maintenance failed", error);
  }
}
