/**
 * observatory.routes.js
 *
 * Route definitions cho Observatory module.
 *
 * Base path (đăng ký trong app.js): /api/observatory
 *
 * QUAN TRỌNG — thứ tự route:
 *   /nearby phải đứng TRƯỚC /:slug
 *   Express match theo thứ tự khai báo — nếu /:slug đứng trước,
 *   GET /nearby sẽ bị hiểu là slug = "nearby" và query DB → 404.
 *
 * Auth strategy:
 *   GET  /             → public (không cần login)
 *   GET  /nearby       → public (user gửi lat/lon từ browser geolocation)
 *   GET  /:slug        → optional auth (nếu login → trả thêm isSaved)
 *   POST /:id/save     → required auth
 */

import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getAll,
  getBySlug,
  getNearby,
  getStats,
  removeSave,
  toggleSave,
} from "./observatory.controller.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

// GET /api/observatory?city=Hanoi&country=Vietnam&isFeatured=true&page=1&limit=20
router.get("/", getAll);

// GET /api/observatory/nearby?lat=21.02&lon=105.84&radius=100
//PHẢI đứng trước /:slug
router.get("/nearby", getNearby);

router.get("/stats", getStats);

// GET /api/observatory/bach-ma-observatory
// Optional auth: authenticate middleware bỏ qua nếu không có token
// (dùng try-catch pattern trong service thay vì hard-require)
router.get("/:slug", (req, res, next) => {
  // Inject user nếu có token, không bắt buộc
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authenticate(req, res, next);
  }
  next();
}, getBySlug);

// ─── Protected routes ─────────────────────────────────────────────────────────

// POST /api/observatory/:id/save  → toggle lưu yêu thích
router.post("/:id/save", authenticate, toggleSave);
router.delete("/:id/save", authenticate, removeSave);

export default router;
