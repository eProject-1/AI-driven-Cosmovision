import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.util.js";
import { AppError } from "../../utils/AppError.js";

import {
  getAllObservatories,
  getNearbyObservatories,
  getObservatoryBySlug,
  toggleSaveObservatory,
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

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new AppError("lat and lon are required", 400);
  }

  const result = await getNearbyObservatories(
    lat,
    lon,
    radius
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