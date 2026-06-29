import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";

import {
  addUserFavorite,
  getImageUploads,
  getMe,
  getSummary,
  updateProfile,
  updatePreferences,
  getRecommendations,
  removeUserEvent,
  removeUserFavorite,
  saveUserEvent,
  getUserSavedEvents,
  getUserSavedObservatories,
} from "./user.controller.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.get("/summary", authenticate, getSummary);
router.patch("/profile", authenticate, updateProfile);
router.patch("/preferences", authenticate, updatePreferences);
router.post("/favorites/:type/:slugOrName", authenticate, addUserFavorite);
router.delete("/favorites/:type/:slugOrName", authenticate, removeUserFavorite);
router.get("/recommendations", authenticate, getRecommendations);
router.get("/saved-events", authenticate, getUserSavedEvents);
router.post("/saved-events/:eventId", authenticate, saveUserEvent);
router.delete("/saved-events/:eventId", authenticate, removeUserEvent);
router.get("/saved-observatories", authenticate, getUserSavedObservatories);
router.get("/image-uploads", authenticate, getImageUploads);

export default router;
