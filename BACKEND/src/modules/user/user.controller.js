import { asyncHandler } from "../../utils/async-handler.util.js";
import { sendSuccess } from "../../utils/response.util.js";
import { parseOrSendError } from "../../utils/validation.util.js";

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

const favoriteTypeMessage = "Favorite type must be planets or constellations";

export const getMe = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.user.id);
  return sendSuccess(res, data, "Current user fetched successfully");
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await getUserSummary(req.user.id);
  return sendSuccess(res, data, "User summary fetched successfully");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const body = parseOrSendError(updateProfileSchema, req.body, res);
  if (!body) return;

  const data = await updateUserProfile(req.user.id, body);
  return sendSuccess(res, data, "Profile updated successfully");
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const body = parseOrSendError(updatePreferencesSchema, req.body, res);
  if (!body) return;

  const data = await updateUserPreferences(req.user.id, body);
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
  const type = parseOrSendError(favoriteTypeSchema, req.params.type, res, favoriteTypeMessage, {
    includeErrors: false,
  });
  if (!type) return;

  const data = await addFavorite(req.user.id, type, req.params.slugOrName);
  return sendSuccess(res, data, "Favorite added successfully", 201);
});

export const removeUserFavorite = asyncHandler(async (req, res) => {
  const type = parseOrSendError(favoriteTypeSchema, req.params.type, res, favoriteTypeMessage, {
    includeErrors: false,
  });
  if (!type) return;

  const data = await removeFavorite(req.user.id, type, req.params.slugOrName);
  return sendSuccess(res, data, "Favorite removed successfully");
});
