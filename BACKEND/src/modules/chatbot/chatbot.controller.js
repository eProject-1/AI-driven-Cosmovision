import { asyncHandler } from "../../utils/async-handler.util.js";
import { sendSuccess } from "../../utils/response.util.js";
import {
  sendMessage as sendMessageService,
  getConversationHistory as getConversationHistoryService,
  listChatSessions as listChatSessionsService,
  clearConversationHistory as clearConversationHistoryService,
  clearAllChatSessions as clearAllChatSessionsService,
} from "./chatbot.service.js";

function getUserIdFromRequest(req) {
  return req.user?.id || req.user?.userId || null;
}

const sendMessage = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { message, sessionId } = req.body;
  const data = await sendMessageService({ userId, message, sessionId });

  return sendSuccess(res, data, "Chat response generated successfully.");
});

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

const listChatSessions = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { limit } = req.query;
  const data = await listChatSessionsService({
    userId,
    limit: limit ? Number(limit) : undefined,
  });

  return sendSuccess(res, data, "Chat sessions fetched successfully.");
});

const clearConversationHistory = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.query;
  const data = await clearConversationHistoryService({ userId, sessionId });

  return sendSuccess(res, data, "Conversation history cleared successfully.");
});

const clearAllChatSessions = asyncHandler(async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const data = await clearAllChatSessionsService({ userId });

  return sendSuccess(res, data, "Chat sessions cleared successfully.");
});

export {
  sendMessage,
  getConversationHistory,
  listChatSessions,
  clearConversationHistory,
  clearAllChatSessions,
};
