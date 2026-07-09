import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createRecommendationSchema } from "./recommendation.validation.js";
import {
  createRecommendation,
  getRecommendationById,
  getUserRecommendations,
  refreshRecommendation,
} from "./recommendation.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", aiRateLimit, validate(createRecommendationSchema), createRecommendation);
router.get("/", getUserRecommendations);
router.post("/:id/refresh", aiRateLimit, refreshRecommendation);
router.get("/:id", getRecommendationById);

export default router;
