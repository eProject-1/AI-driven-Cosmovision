import api from "./api.js";

export const sendMessage = async (message, sessionId = null) => {
  const { data } = await api.post("/chatbot/message", {
    message,
    ...(sessionId && { sessionId }),
  });
  return data.data;
};

export const getChatHistory = async (sessionId) => {
  const { data } = await api.get("/chatbot/history", {
    params: { sessionId },
  });
  return data.data;
};
