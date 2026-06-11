import api from "./api.js";

export const sendMessage = async (message) => {
  const { data } = await api.post("/chatbot", { message });
  return data.data; // { reply, chatId }
};

export const getChatHistory = async () => {
  const { data } = await api.get("/chatbot/history");
  return data.data;
};