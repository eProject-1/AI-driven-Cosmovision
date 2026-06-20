import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.util.js";
import {
  sendMessage as sendMessageService,
  getConversationHistory as getConversationHistoryService,
  clearConversationHistory as clearConversationHistoryService,
} from "./chatbot.service.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

function getUserIdFromRequest(req) {
  return req.user?.userId || req.user?.id || req.body?.userId || null;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/chatbot/message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { message, sessionId } = req.body;

  const data = await sendMessageService({ userId, message, sessionId });

  return sendSuccess(res, data, "Chat response generated successfully.");
});

/**
 * GET /api/chatbot/conversation
 */
const getConversationHistory = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { limit, sessionId } = req.query;

  const data = await getConversationHistoryService({
    userId,
    sessionId,
    limit: limit ? Number(limit) : undefined,
  });

  return sendSuccess(res, data, "Conversation history fetched successfully.");
});

/**
 * DELETE /api/chatbot/conversation
 */
const clearConversationHistory = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.query;

  const data = await clearConversationHistoryService({ userId, sessionId });

  return sendSuccess(res, data, "Conversation history cleared successfully.");
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export { sendMessage, getConversationHistory, clearConversationHistory };