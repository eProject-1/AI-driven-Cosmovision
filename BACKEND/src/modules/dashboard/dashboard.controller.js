import { asyncHandler } from "../../utils/async.handler.util.js";
import { sendSuccess } from "../../utils/response.util.js";
import { getDashboardData } from "./dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;

  const data = await getDashboardData({
    userId,
    query: req.query,
  });

  return sendSuccess(res, data, "Dashboard data fetched successfully");
});