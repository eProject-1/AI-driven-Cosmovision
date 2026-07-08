import { asyncHandler } from "../../utils/async-handler.util.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { trackAnalyticsEvent } from "../../services/analytics/analytics.service.js";
import { smartSearch } from "./search.service.js";

const logger = createLogger("search");

export const search = asyncHandler(async (req, res) => {
  const data = await smartSearch({
    ...req.query,
    query: req.query.q || req.query.query,
  });

  trackAnalyticsEvent({
    userId: req.user?.id || null,
    event: "SEARCH",
    entityType: "search",
    entityName: data.query,
    metadata: { targets: data.interpreted.targets, total: data.total },
    req,
  }).catch((error) => logger.error("Search analytics tracking failed", error));

  return sendSuccess(res, data, "Search completed successfully");
});

export const searchWithBody = asyncHandler(async (req, res) => {
  const data = await smartSearch({
    ...req.body,
    query: req.body.q || req.body.query,
  });

  trackAnalyticsEvent({
    userId: req.user?.id || null,
    event: "SEARCH",
    entityType: "search",
    entityName: data.query,
    metadata: { targets: data.interpreted.targets, total: data.total },
    req,
  }).catch((error) => logger.error("Search analytics tracking failed", error));

  return sendSuccess(res, data, "Search completed successfully");
});
