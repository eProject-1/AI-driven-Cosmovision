// modules/astronomy/constellations/constellation.controller.js
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.util.js";
import {
  getAllConstellations as fetchAllConstellations,
  getConstellationBySlug as fetchConstellationBySlug,
  getConstellationAIContent as fetchAIContent,
  getRelatedConstellations,
  getConstellationsByMonth,
} from "./constellation.service.js";

export const getAllConstellations = asyncHandler(async (req, res) => {
  const { search, season, quadrant } = req.query;
  const constellations = await fetchAllConstellations({ search, season, quadrant });
  return sendSuccess(res, constellations);
});

export const getConstellationBySlug = asyncHandler(async (req, res) => {
  const constellation = await fetchConstellationBySlug(req.params.slug);
  return sendSuccess(res, constellation);
});

export const getConstellationAIContent = asyncHandler(async (req, res) => {
  const refresh = req.query.refresh === "true" && req.user?.role === "ADMIN";
  const data = await fetchAIContent(req.params.slug, { refresh });
  return sendSuccess(res, data);
});

export const refreshConstellationAIContent = asyncHandler(async (req, res) => {
  const data = await fetchAIContent(req.params.slug, { refresh: true });
  return sendSuccess(res, data, "AI content refreshed successfully");
});

export const getRelatedConstellation = asyncHandler(async (req, res) => {
  const related = await getRelatedConstellations(req.params.slug);
  return sendSuccess(res, related);
});

export const getByMonth = asyncHandler(async (req, res) => {
  const data = await getConstellationsByMonth(req.params.month);
  return sendSuccess(res, data);
});