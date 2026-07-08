import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
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

router.post("/", validate(createRecommendationSchema), createRecommendation);
router.get("/", getUserRecommendations);
router.post("/:id/refresh", refreshRecommendation);
router.get("/:id", getRecommendationById);

export default router;
