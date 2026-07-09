import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { aiRateLimit } from "../../middlewares/rate-limit.middleware.js";

import {
  createNews,
  deleteNews,
  listNews,
  getNewsDetail,
  fetchNews,
  fetchNasaNews,
  fetchExoplanetNews,
  refreshNews,
  cleanupNews,
  summarizeNews,
  aiSummary,
  aiImportance,
  aiCategory,
  aiTags,
  aiExplain,
  aiQuestion,
  dashboardHighlights,
  updateNews,
} from "./news.controller.js";

const router = Router();
const adminOnly = [authenticate, roleMiddleware("ADMIN")];

router.get("/", listNews);
router.post("/", ...adminOnly, createNews);
router.get("/dashboard/highlights", dashboardHighlights);
router.get("/:slug", getNewsDetail);
router.patch("/:slug", ...adminOnly, updateNews);
router.delete("/:slug", ...adminOnly, deleteNews);

router.post("/fetch", ...adminOnly, aiRateLimit, fetchNews);
router.post("/fetch/nasa", ...adminOnly, aiRateLimit, fetchNasaNews);
router.post("/fetch/exoplanets", ...adminOnly, aiRateLimit, fetchExoplanetNews);
router.post("/refresh", ...adminOnly, aiRateLimit, refreshNews);
router.post("/cleanup", ...adminOnly, cleanupNews);
router.post("/:id/summarize", ...adminOnly, aiRateLimit, summarizeNews);
router.post("/:id/ai/summary", ...adminOnly, aiRateLimit, aiSummary);
router.post("/:id/ai/importance", ...adminOnly, aiRateLimit, aiImportance);
router.post("/:id/ai/category", ...adminOnly, aiRateLimit, aiCategory);
router.post("/:id/ai/tags", ...adminOnly, aiRateLimit, aiTags);
router.post("/:id/ai/explain", ...adminOnly, aiRateLimit, aiExplain);
router.post("/:id/ai/question", ...adminOnly, aiRateLimit, aiQuestion);

export default router;
