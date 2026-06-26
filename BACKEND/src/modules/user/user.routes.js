import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";

import {
  getMe,
  updateProfile,
  updatePreferences,
  getRecommendations,
  getUserSavedEvents,
  getUserSavedObservatories,
} from "./user.controller.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);
router.patch("/preferences", authenticate, updatePreferences);
router.get("/recommendations", authenticate, getRecommendations);
router.get("/saved-events", authenticate, getUserSavedEvents);
router.get("/saved-observatories", authenticate, getUserSavedObservatories);

export default router;