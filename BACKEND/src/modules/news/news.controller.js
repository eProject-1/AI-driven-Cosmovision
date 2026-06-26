import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.util.js";

import {
  getNewsQuerySchema,
  fetchNewsSchema,
  summarizeNewsSchema,
  cleanupNewsSchema,
} from "./news.validation.js";

import {
  getNewsList,
  getNewsBySlug,
  fetchLatestNews,
  fetchLatestNasaNews,
  fetchLatestExoplanetNews,
  summarizeNewsArticle,
  getDashboardNewsHighlights,
  cleanupOldNews,
  runNewsMaintenance,
} from "./news.service.js";

export const listNews = asyncHandler(async (req, res) => {
  const parsed = getNewsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await getNewsList(parsed.data);
  return sendSuccess(res, data, "News articles fetched successfully");
});

export const getNewsDetail = asyncHandler(async (req, res) => {
  const data = await getNewsBySlug(req.params.slug);
  return sendSuccess(res, data, "News article fetched successfully");
});

export const fetchNews = asyncHandler(async (req, res) => {
  const parsed = fetchNewsSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await fetchLatestNews(parsed.data);
  return sendSuccess(res, data, "External astronomy news fetched successfully", 201);
});

export const refreshNews = asyncHandler(async (req, res) => {
  const parsed = fetchNewsSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await runNewsMaintenance(parsed.data);
  return sendSuccess(res, data, "News maintenance completed successfully", 201);
});

export const fetchNasaNews = asyncHandler(async (req, res) => {
  const data = await fetchLatestNasaNews({
    pageSize: Number(req.body?.pageSize || 10),
  });

  return sendSuccess(res, data, "NASA news fetched successfully", 201);
});

export const fetchExoplanetNews = asyncHandler(async (req, res) => {
  const data = await fetchLatestExoplanetNews({
    pageSize: Number(req.body?.pageSize || 10),
  });

  return sendSuccess(res, data, "Exoplanet news fetched successfully", 201);
});

export const summarizeNews = asyncHandler(async (req, res) => {
  const parsed = summarizeNewsSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await summarizeNewsArticle(req.params.id, parsed.data);
  return sendSuccess(res, data, "News article summarized successfully");
});

export const cleanupNews = asyncHandler(async (req, res) => {
  const parsed = cleanupNewsSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await cleanupOldNews(parsed.data);
  return sendSuccess(res, data, "Old news articles cleaned up successfully");
});

export const dashboardHighlights = asyncHandler(async (req, res) => {
  const data = await getDashboardNewsHighlights(req.query.limit || 5);
  return sendSuccess(res, data, "Dashboard news highlights fetched successfully");
});
