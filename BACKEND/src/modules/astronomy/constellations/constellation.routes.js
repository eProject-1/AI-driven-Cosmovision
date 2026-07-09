import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../../middlewares/role.middleware.js";
import { aiRateLimit, uploadRateLimit } from "../../../middlewares/rate-limit.middleware.js";
import { uploadConstellationImage } from "../../../middlewares/upload.middleware.js";
import {
  createConstellation,
  deleteConstellation,
  deleteMyConstellationUpload,
  getAllConstellations,
  getByMonth,
  getConstellationAIContent,
  getConstellationBySlug,
  getConstellationGallery,
  getMyConstellationUploads,
  getRelatedConstellation,
  recognizeConstellationImage,
  refreshConstellationAIContent,
  updateConstellation,
} from "./constellation.controller.js";

const router = Router();
const adminOnly = [authenticate, roleMiddleware("ADMIN")];

// Public catalog routes
router.get("/", getAllConstellations);
router.get("/month/:month", getByMonth);

// Authenticated user scan history and recognition
router.get("/uploads/me", authenticate, getMyConstellationUploads);
router.delete("/uploads/:uploadId", authenticate, deleteMyConstellationUpload);
router.post("/recognize", authenticate, uploadRateLimit, uploadConstellationImage, recognizeConstellationImage);

// Public constellation detail helpers
router.get("/:slug/ai-content", getConstellationAIContent);
router.get("/:slug/related", getRelatedConstellation);
router.get("/:slug/gallery", getConstellationGallery);
router.get("/:slug", getConstellationBySlug);

// Admin-only catalog mutation routes
router.post("/", ...adminOnly, createConstellation);
router.patch("/:slug", ...adminOnly, updateConstellation);
router.delete("/:slug", ...adminOnly, deleteConstellation);
router.post("/:slug/ai-content/refresh", ...adminOnly, aiRateLimit, refreshConstellationAIContent);

export default router;
