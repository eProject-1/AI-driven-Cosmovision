import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

import {
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
} from "./news.controller.js";

const router = Router();

router.get("/", listNews);
router.get("/dashboard/highlights", dashboardHighlights);
router.get("/:slug", getNewsDetail);

router.post("/fetch", authenticate, roleMiddleware("ADMIN"), fetchNews);
router.post("/fetch/nasa", authenticate, roleMiddleware("ADMIN"), fetchNasaNews);
router.post("/fetch/exoplanets", authenticate, roleMiddleware("ADMIN"), fetchExoplanetNews);
router.post("/refresh", authenticate, roleMiddleware("ADMIN"), refreshNews);
router.post("/cleanup", authenticate, roleMiddleware("ADMIN"), cleanupNews);
router.post("/:id/summarize", authenticate, roleMiddleware("ADMIN"), summarizeNews);
router.post("/:id/ai/summary", aiSummary);
router.post("/:id/ai/importance", aiImportance);
router.post("/:id/ai/category", aiCategory);
router.post("/:id/ai/tags", aiTags);
router.post("/:id/ai/explain", aiExplain);
router.post("/:id/ai/question", aiQuestion);

export default router;
