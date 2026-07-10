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
const aiOnly = [authenticate, aiRateLimit];

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
router.post("/:id/summarize", ...aiOnly, summarizeNews);
router.post("/:id/ai/summary", ...aiOnly, aiSummary);
router.post("/:id/ai/importance", ...aiOnly, aiImportance);
router.post("/:id/ai/category", ...aiOnly, aiCategory);
router.post("/:id/ai/tags", ...aiOnly, aiTags);
router.post("/:id/ai/explain", ...aiOnly, aiExplain);
router.post("/:id/ai/question", ...aiOnly, aiQuestion);

export default router;
