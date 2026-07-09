// modules/astronomy/constellations/constellation.controller.js
import { asyncHandler } from "../../../utils/async.handler.util.js";
import { sendSuccess } from "../../../utils/response.util.js";
import { buildUploadedFileUrl } from "../../../middlewares/upload.middleware.js";
import { env } from "../../../config/env.js";
import {
  createConstellation as createConstellationRecord,
  deleteConstellation as deleteConstellationRecord,
  getAllConstellations as fetchAllConstellations,
  getConstellationBySlug as fetchConstellationBySlug,
  getConstellationAIContent as fetchAIContent,
  getConstellationGallery as fetchConstellationGallery,
  getRelatedConstellations,
  getConstellationsByMonth,
  recognizeConstellationImage as recognizeUploadedImage,
  getUserConstellationUploads as fetchUserUploads,
  deleteUserConstellationUpload as removeUserUpload,
  updateConstellation as updateConstellationRecord,
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

export const getConstellationGallery = asyncHandler(async (req, res) => {
  const data = await fetchConstellationGallery(req.params.slug, {
    baseUrl: env.API_PUBLIC_URL,
    limit: req.query.limit,
  });
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

export const createConstellation = asyncHandler(async (req, res) => {
  const data = await createConstellationRecord(req.body);
  return sendSuccess(res, data, "Constellation created successfully", 201);
});

export const updateConstellation = asyncHandler(async (req, res) => {
  const data = await updateConstellationRecord(req.params.slug, req.body);
  return sendSuccess(res, data, "Constellation updated successfully");
});

export const deleteConstellation = asyncHandler(async (req, res) => {
  const data = await deleteConstellationRecord(req.params.slug);
  return sendSuccess(res, data, "Constellation deleted successfully");
});

export const recognizeConstellationImage = asyncHandler(async (req, res) => {
  const data = await recognizeUploadedImage({
    userId: req.user?.id,
    file: req.file,
    fileUrl: req.file ? buildUploadedFileUrl(req, req.file) : null,
    hint: req.body?.hint,
  });

  return sendSuccess(res, data, "Constellation image processed successfully", 201);
});

export const getMyConstellationUploads = asyncHandler(async (req, res) => {
  const data = await fetchUserUploads(req.user?.id, { limit: req.query.limit });
  return sendSuccess(res, data);
});

export const deleteMyConstellationUpload = asyncHandler(async (req, res) => {
  const data = await removeUserUpload(req.user?.id, req.params.uploadId);
  return sendSuccess(res, data, "Scan history item deleted successfully");
});
