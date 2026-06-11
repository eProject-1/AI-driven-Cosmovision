import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.util.js";
import { chat, getChatHistory } from "./chatbot.service.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return sendError(res, "Tin nhắn không được trống", 400);
  const result = await chat(req.user.id, message.trim());
  return sendSuccess(res, result);
});

export const getHistory = asyncHandler(async (req, res) => {
  const messages = await getChatHistory(req.user.id);
  return sendSuccess(res, messages);
});