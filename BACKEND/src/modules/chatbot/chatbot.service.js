import groq from "../../config/groq.js";
import prisma from "../../config/db.js";
import { detectIntent } from "./intent.service.js";
import { buildPrompt } from "./prompt.service.js";

const SYSTEM_PROMPT = `You are CosmoBot, a friendly astronomy assistant for CosmoVision.
Answer in Vietnamese, keep answers concise, helpful, and focused on astronomy.`;

const demoReply = (message) => {
  const text = message.toLowerCase();
  if (text.includes("mars") || text.includes("sao hoa")) {
    return "Sao Hoa la hanh tinh da noi tieng voi mau do do oxit sat tren be mat. No co 2 ve tinh la Phobos va Deimos, va tung co dau vet cua nuoc long trong qua khu.";
  }
  if (text.includes("saturn") || text.includes("sao tho")) {
    return "Sao Tho noi bat voi he vanh dai bang da va bang tuyet cuc ky dep. Titan, mot ve tinh cua Sao Tho, co khi quyen day va la muc tieu nghien cuu rat thu vi.";
  }
  if (text.includes("constellation") || text.includes("chom sao")) {
    return "Chom sao la cac nhom sao duoc con nguoi dat ten de dinh huong va ke chuyen tren bau troi. Orion, Ursa Major va Scorpius la nhung chom sao de nhan biet.";
  }
  return "Minh la CosmoBot. Ban co the hoi ve hanh tinh, chom sao, mua sao bang, nhat thuc, kinh thien van hoac cach quan sat bau troi dem.";
};

const toPrismaIntent = (intent) => {
  const map = {
    planet: "PLANET_INFO",
    constellation: "CONSTELLATION_INFO",
    weather: "WEATHER_CHECK",
    general: "GENERAL_ASTRONOMY",
  };
  return map[intent?.type] || "UNKNOWN";
};

const getReply = async (userMessage) => {
  try {
    const intent = detectIntent(userMessage);
    const prompt = buildPrompt(intent, userMessage);
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt || userMessage },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return completion.choices?.[0]?.message?.content || demoReply(userMessage);
  } catch (error) {
    console.warn("[chatbot] Groq unavailable, using demo reply:", error.message);
    return demoReply(userMessage);
  }
};

export const chat = async (userId, userMessage) => {
  const intent = detectIntent(userMessage);
  let chatSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId, title: userMessage.slice(0, 48) },
    });
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: "user",
      content: userMessage,
      intent: toPrismaIntent(intent),
    },
  });

  const reply = await getReply(userMessage);

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: "assistant",
      content: reply,
      intent: toPrismaIntent(intent),
    },
  });

  await prisma.chatSession.update({
    where: { id: chatSession.id },
    data: { updatedAt: new Date() },
  });

  return { reply, chatId: chatSession.id };
};

export const getChatHistory = async (userId) => {
  const chatSession = await prisma.chatSession.findFirst({
    where: { userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return chatSession?.messages || [];
};
