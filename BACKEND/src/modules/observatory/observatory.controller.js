import { asyncHandler } from "../../utils/controller.helpers.util.js";
import { sendSuccess } from "../../utils/controller.helpers.util.js";
import { AppError } from "../../utils/app.error.util.js";

import {
  createObservatory,
  deleteObservatory,
  getAllObservatories,
  getNearbyObservatories,
  getObservatoryBySlug,
  getObservatoryStats,
  getUserObservatoryPlans,
  toggleSaveObservatory,
  updateObservatory,
} from "./observatory.service.js";

/**
 * GET /api/observatory
 */
export const getAll = asyncHandler(async (req, res) => {
  const result = await getAllObservatories(req.query);

  return sendSuccess(
    res,
    result,
    "Observatories fetched successfully"
  );
});

/**
 * GET /api/observatory/nearby
 */
export const getNearby = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Number(req.query.radius) || 100;
  const limit = Number(req.query.limit) || 20;
  const includeWeather = req.query.includeWeather === "true";

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new AppError("lat and lon are required", 400);
  }

  const result = await getNearbyObservatories(
    lat,
    lon,
    radius,
    {
      limit,
      includeWeather,
    }
  );

  return sendSuccess(
    res,
    result,
    "Nearby observatories fetched successfully"
  );
});

/**
 * GET /api/observatory/:slug
 */
export const getBySlug = asyncHandler(async (req, res) => {
  const userId = req.user?.id ?? null;

  const result = await getObservatoryBySlug(
    req.params.slug,
    userId
  );

  return sendSuccess(
    res,
    result,
    "Observatory fetched successfully"
  );
});

/**
 * GET /api/observatory/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const result = await getObservatoryStats(
    req.query,
    req.user?.id ?? null
  );

  return sendSuccess(
    res,
    result,
    "Observatory stats fetched successfully"
  );
});

/**
 * POST /api/observatory/:id/save
 */
export const toggleSave = asyncHandler(async (req, res) => {
  const result = await toggleSaveObservatory(
    req.params.id,
    req.user.id
  );

  return sendSuccess(
    res,
    result,
    result.saved
      ? `${result.observatoryName} saved successfully`
      : `${result.observatoryName} removed successfully`
  );
});

/**
 * GET /api/observatory/plans
 */
export const getPlans = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const result = await getUserObservatoryPlans(req.user.id, { limit });

  return sendSuccess(res, result, "Observatory plans fetched successfully");
});

export const create = asyncHandler(async (req, res) => {
  const result = await createObservatory(req.body);
  return sendSuccess(res, result, "Observatory created successfully", 201);
});

export const update = asyncHandler(async (req, res) => {
  const result = await updateObservatory(req.params.slug, req.body);
  return sendSuccess(res, result, "Observatory updated successfully");
});

export const remove = asyncHandler(async (req, res) => {
  const result = await deleteObservatory(req.params.slug);
  return sendSuccess(res, result, "Observatory deleted successfully");
});
