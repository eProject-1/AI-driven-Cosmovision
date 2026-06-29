import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.util.js";

import {
  updateProfileSchema,
  updatePreferencesSchema,
  favoriteTypeSchema,
} from "./user.validation.js";

import {
  addFavorite,
  getCurrentUser,
  getUserImageUploads,
  updateUserProfile,
  updateUserPreferences,
  getUserRecommendations,
  getSavedEvents,
  getSavedObservatories,
  getUserSummary,
  removeFavorite,
  removeSavedEvent,
  saveEvent,
} from "./user.service.js";

export const getMe = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.user.id);
  return sendSuccess(res, data, "Current user fetched successfully");
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await getUserSummary(req.user.id);
  return sendSuccess(res, data, "User summary fetched successfully");
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

export const saveUserEvent = asyncHandler(async (req, res) => {
  const data = await saveEvent(req.user.id, req.params.eventId);
  return sendSuccess(res, data, "Event saved successfully", 201);
});

export const removeUserEvent = asyncHandler(async (req, res) => {
  const data = await removeSavedEvent(req.user.id, req.params.eventId);
  return sendSuccess(res, data, "Saved event removed successfully");
});

export const getUserSavedObservatories = asyncHandler(async (req, res) => {
  const data = await getSavedObservatories(req.user.id);
  return sendSuccess(res, data, "Saved observatories fetched successfully");
});

export const getImageUploads = asyncHandler(async (req, res) => {
  const data = await getUserImageUploads(req.user.id, req.query.limit);
  return sendSuccess(res, data, "Image uploads fetched successfully");
});

export const addUserFavorite = asyncHandler(async (req, res) => {
  const parsedType = favoriteTypeSchema.safeParse(req.params.type);
  if (!parsedType.success) {
    return sendError(res, "Favorite type must be planets or constellations", 400);
  }

  const data = await addFavorite(req.user.id, parsedType.data, req.params.slugOrName);
  return sendSuccess(res, data, "Favorite added successfully", 201);
});

export const removeUserFavorite = asyncHandler(async (req, res) => {
  const parsedType = favoriteTypeSchema.safeParse(req.params.type);
  if (!parsedType.success) {
    return sendError(res, "Favorite type must be planets or constellations", 400);
  }

  const data = await removeFavorite(req.user.id, parsedType.data, req.params.slugOrName);
  return sendSuccess(res, data, "Favorite removed successfully");
});
