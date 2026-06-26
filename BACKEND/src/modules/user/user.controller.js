import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.util.js";

import {
  updateProfileSchema,
  updatePreferencesSchema,
} from "./user.validation.js";

import {
  getCurrentUser,
  updateUserProfile,
  updateUserPreferences,
  getUserRecommendations,
  getSavedEvents,
  getSavedObservatories,
} from "./user.service.js";

export const getMe = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.user.id);
  return sendSuccess(res, data, "Current user fetched successfully");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await updateUserProfile(req.user.id, parsed.data);
  return sendSuccess(res, data, "Profile updated successfully");
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const parsed = updatePreferencesSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = await updateUserPreferences(req.user.id, parsed.data);
  return sendSuccess(res, data, "Preferences updated successfully");
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const data = await getUserRecommendations(req.user.id, req.query.limit);
  return sendSuccess(res, data, "Recommendations fetched successfully");
});

export const getUserSavedEvents = asyncHandler(async (req, res) => {
  const data = await getSavedEvents(req.user.id);
  return sendSuccess(res, data, "Saved events fetched successfully");
});

export const getUserSavedObservatories = asyncHandler(async (req, res) => {
  const data = await getSavedObservatories(req.user.id);
  return sendSuccess(res, data, "Saved observatories fetched successfully");
});