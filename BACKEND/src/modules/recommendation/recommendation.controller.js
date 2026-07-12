import { asyncHandler } from "../../utils/controller.helpers.util.js";
import { sendSuccess } from "../../utils/controller.helpers.util.js";
import {
  createRecommendation as createRecommendationService,
  getRecommendationById as getRecommendationByIdService,
  getUserRecommendations as getUserRecommendationsService,
} from "./recommendation.service.js";

export const createRecommendation = asyncHandler(async (req, res) => {
  const { latitude, longitude, locationName } = req.body;
  const data = await createRecommendationService({
    userId: req.user.id,
    latitude,
    longitude,
    locationName,
  });

  return sendSuccess(res, data, "Recommendation created successfully", 201);
});

export const getUserRecommendations = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const data = await getUserRecommendationsService(req.user.id, { limit });

  return sendSuccess(res, data, "Recommendations fetched successfully");
});

export const getRecommendationById = asyncHandler(async (req, res) => {
  const data = await getRecommendationByIdService(req.params.id, req.user.id);
  return sendSuccess(res, data);
});

export const refreshRecommendation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const original = await getRecommendationByIdService(id, req.user.id);
  const data = await createRecommendationService({
    userId: req.user.id,
    latitude: original.latitude,
    longitude: original.longitude,
    locationName: original.locationName,
    forceRefresh: true,
  });

  return sendSuccess(
    res,
    { ...data, refreshedFromId: id },
    "Recommendation refreshed successfully",
    201
  );
});
