import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createRecommendationSchema } from "./recommendation.validation.js";
import {
  createRecommendation,
  getUserRecommendations,
  getRecommendationById,
  refreshRecommendation,
} from "./recommendation.controller.js";

const router = Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// POST /api/recommendations — Tạo gợi ý mới (có cache 30 phút theo toạ độ)
router.post("/", validate(createRecommendationSchema), createRecommendation);

// GET /api/recommendations — Lịch sử gợi ý của user
router.get("/", getUserRecommendations);

// POST /api/recommendations/:id/refresh — Làm mới gợi ý, bỏ qua cache
router.post("/:id/refresh", refreshRecommendation);

// GET /api/recommendations/:id — Chi tiết một gợi ý
router.get("/:id", getRecommendationById);

export default router;