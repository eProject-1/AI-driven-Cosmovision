import { asyncHandler } from "../../utils/async.handler.util.js";
import { sendSuccess } from "../../utils/response.util.js";
import { parseOrSendError } from "../../utils/validation.util.js";

import {
  getNewsQuerySchema,
  fetchNewsSchema,
  summarizeNewsSchema,
  cleanupNewsSchema,
  newsAiRequestSchema,
  newsQuestionSchema,
} from "./news.validation.js";

import {
  createNewsArticle,
  deleteNewsArticle,
  getNewsList,
  getNewsBySlug,
  fetchLatestNews,
  fetchLatestNasaNews,
  fetchLatestExoplanetNews,
  summarizeNewsArticle,
  getDashboardNewsHighlights,
  cleanupOldNews,
  runNewsMaintenance,
  generateNewsAiSummary,
  generateNewsImportance,
  generateNewsAiCategory,
  generateNewsAiTags,
  explainNewsArticle,
  answerNewsQuestion,
  updateNewsArticle,
} from "./news.service.js";

export const listNews = asyncHandler(async (req, res) => {
  const query = parseOrSendError(getNewsQuerySchema, req.query, res);
  if (!query) return;

  const data = await getNewsList(query);
  return sendSuccess(res, data, "News articles fetched successfully");
});

export const getNewsDetail = asyncHandler(async (req, res) => {
  const data = await getNewsBySlug(req.params.slug);
  return sendSuccess(res, data, "News article fetched successfully");
});

export const createNews = asyncHandler(async (req, res) => {
  const data = await createNewsArticle(req.body);
  return sendSuccess(res, data, "News article created successfully", 201);
});

export const updateNews = asyncHandler(async (req, res) => {
  const data = await updateNewsArticle(req.params.slug, req.body);
  return sendSuccess(res, data, "News article updated successfully");
});

export const deleteNews = asyncHandler(async (req, res) => {
  const data = await deleteNewsArticle(req.params.slug);
  return sendSuccess(res, data, "News article deleted successfully");
});

export const fetchNews = asyncHandler(async (req, res) => {
  const body = parseOrSendError(fetchNewsSchema, req.body, res);
  if (!body) return;

  const data = await fetchLatestNews(body);
  return sendSuccess(res, data, "External astronomy news fetched successfully", 201);
});

export const refreshNews = asyncHandler(async (req, res) => {
  const body = parseOrSendError(fetchNewsSchema, req.body || {}, res);
  if (!body) return;

  const data = await runNewsMaintenance(body);
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
  const body = parseOrSendError(summarizeNewsSchema, req.body, res);
  if (!body) return;

  const data = await summarizeNewsArticle(req.params.id, body);
  return sendSuccess(res, data, "News article summarized successfully");
});

const parseAiRequest = (req, res) => parseOrSendError(newsAiRequestSchema, req.body || {}, res);

export const aiSummary = asyncHandler(async (req, res) => {
  const body = parseAiRequest(req, res);
  if (!body) return;
  const data = await generateNewsAiSummary(req.params.id, body);
  return sendSuccess(res, data, "AI summary generated successfully");
});

export const aiImportance = asyncHandler(async (req, res) => {
  const body = parseAiRequest(req, res);
  if (!body) return;
  const data = await generateNewsImportance(req.params.id, body);
  return sendSuccess(res, data, "News importance generated successfully");
});

export const aiCategory = asyncHandler(async (req, res) => {
  const body = parseAiRequest(req, res);
  if (!body) return;
  const data = await generateNewsAiCategory(req.params.id, body);
  return sendSuccess(res, data, "AI category generated successfully");
});

export const aiTags = asyncHandler(async (req, res) => {
  const body = parseAiRequest(req, res);
  if (!body) return;
  const data = await generateNewsAiTags(req.params.id, body);
  return sendSuccess(res, data, "AI tags generated successfully");
});

export const aiExplain = asyncHandler(async (req, res) => {
  const data = await explainNewsArticle(req.params.id);
  return sendSuccess(res, data, "News article explained successfully");
});

export const aiQuestion = asyncHandler(async (req, res) => {
  const body = parseOrSendError(newsQuestionSchema, req.body || {}, res);
  if (!body) return;

  const data = await answerNewsQuestion(req.params.id, body.question);
  return sendSuccess(res, data, "News question answered successfully");
});

export const cleanupNews = asyncHandler(async (req, res) => {
  const body = parseOrSendError(cleanupNewsSchema, req.body || {}, res);
  if (!body) return;

  const data = await cleanupOldNews(body);
  return sendSuccess(res, data, "Old news articles cleaned up successfully");
});

export const dashboardHighlights = asyncHandler(async (req, res) => {
  const data = await getDashboardNewsHighlights(req.query.limit || 5);
  return sendSuccess(res, data, "Dashboard news highlights fetched successfully");
});
