import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.util.js";
import {
  getDashboardAnalytics,
  getOverviewStats,
  getPopularEntities,
  getRecentActivities,
  trackAnalyticsEvent,
} from "../../services/analytics/analytics.service.js";

export const trackEvent = asyncHandler(async (req, res) => {
  const data = await trackAnalyticsEvent({
    userId: req.user?.id || req.body.userId || null,
    event: req.body.event,
    entityType: req.body.entityType,
    entityId: req.body.entityId,
    entityName: req.body.entityName,
    metadata: req.body.metadata || {},
    req,
  });

  return sendSuccess(res, data, "Analytics event tracked", 201);
});

export const dashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await getDashboardAnalytics({
    days: req.query.days,
    limit: req.query.limit,
    userId: req.user?.id || null,
  });

  return sendSuccess(res, data, "Analytics dashboard fetched successfully");
});

export const overview = asyncHandler(async (req, res) => {
  const data = await getOverviewStats({ days: req.query.days });
  return sendSuccess(res, data, "Analytics overview fetched successfully");
});

export const popularEntities = asyncHandler(async (req, res) => {
  const data = await getPopularEntities({ days: req.query.days, limit: req.query.limit });
  return sendSuccess(res, data, "Popular entities fetched successfully");
});

export const recentActivities = asyncHandler(async (req, res) => {
  const data = await getRecentActivities({ limit: req.query.limit });
  return sendSuccess(res, data, "Recent activities fetched successfully");
});
