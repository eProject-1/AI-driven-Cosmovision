// modules/astronomy/constellations/constellation.routes.js
import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../../middlewares/role.middleware.js";
import {
  getAllConstellations,
  getConstellationBySlug,
  getConstellationAIContent,
  refreshConstellationAIContent,
  getRelatedConstellation,
  getByMonth,
} from "./constellation.controller.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────────

// GET /api/astronomy/constellations
// Query: ?search=orion  ?season=winter  ?quadrant=NQ1
router.get("/", getAllConstellations);

// GET /api/astronomy/constellations/month/:month   (1–12)
router.get("/month/:month", getByMonth);

// GET /api/astronomy/constellations/:slug/ai-content
// Query: ?refresh=true (chỉ có tác dụng với ADMIN)
router.get("/:slug/ai-content", getConstellationAIContent);

// GET /api/astronomy/constellations/:slug/related
router.get("/:slug/related", getRelatedConstellation);

// GET /api/astronomy/constellations/:slug
router.get("/:slug", getConstellationBySlug);

// ─── Admin-only routes ────────────────────────────────────────

// POST /api/astronomy/constellations/:slug/ai-content/refresh
router.post(
  "/:slug/ai-content/refresh",
  authenticate,
  roleMiddleware("ADMIN"),
  refreshConstellationAIContent
);

export default router;