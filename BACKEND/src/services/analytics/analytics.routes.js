import { Router } from "express";
import { authenticate, tryAuthenticate } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import {
  dashboardAnalytics,
  overview,
  popularEntities,
  recentActivities,
  trackEvent,
} from "./analytics.controller.js";

const router = Router();

// POST /api/analytics/track
// Body: { event, entityType?, entityId?, entityName?, metadata? }
router.post("/track", tryAuthenticate, trackEvent);

router.use(authenticate, roleMiddleware("ADMIN"));

router.get("/dashboard", dashboardAnalytics);
router.get("/overview", overview);
router.get("/popular-entities", popularEntities);
router.get("/recent-activities", recentActivities);

export default router;
