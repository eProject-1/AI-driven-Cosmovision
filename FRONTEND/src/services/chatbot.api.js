import { deleteData, getData, postData } from "./api.js";

export const sendMessage = (message, sessionId = null) =>
  postData("/chatbot/message", {
    message,
    ...(sessionId && { sessionId }),
  });

export const getChatHistory = (sessionId, { limit = 50 } = {}) =>
  getData("/chatbot/history", {
    params: { sessionId, limit },
  });

export const getChatSessions = ({ limit = 20 } = {}) =>
  getData("/chatbot/sessions", {
    params: { limit },
  });

export const clearChatHistory = (sessionId) =>
  deleteData("/chatbot/history", {
    params: { sessionId },
  });

export const clearChatSessions = () => deleteData("/chatbot/sessions");
