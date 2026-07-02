import groq from "../../config/groq.js";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

import {
  detectIntent,
  extractPlanetName,
} from "../../services/chatbot/intent.service.js";

import {
  getConversationHistory as fetchConversationHistory,
  saveConversation,
  createSession,
  getSessionById,
  deleteSession,
} from "../../services/chatbot/memory.service.js";

import { buildChatMessages } from "../../services/chatbot/prompt.service.js";

import { getPersonalizedRecommendations } from "../../services/chatbot/recommendation.service.js";
import { trackAnalyticsEvent } from "../../services/analytics/analytics.service.js";

// ==================== CONFIG & CONSTANTS ====================
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const DEFAULT_TEMPERATURE = Number(process.env.GROQ_TEMPERATURE || 0.7);
const DEFAULT_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 800);

const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_HISTORY_LIMIT = 25;
const DEFAULT_CHAT_HISTORY_LIMIT = 20;
const MAX_CHAT_HISTORY_LIMIT = 50;
const VIETNAMESE_ACCENT_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const VIETNAMESE_WORD_RE = /\b(toi|tôi|ban|bạn|minh|mình|hay|hãy|la|là|gi|gì|sao|vi sao|vì sao|nhu the nao|như thế nào|khi nao|khi nào|o dau|ở đâu|co gi|có gì|quan sat|quan sát|chom sao|chòm sao|hanh tinh|hành tinh|mua sao bang|mưa sao băng|bau troi|bầu trời|dem nay|đêm nay|thoi tiet|thời tiết)\b/i;

// ==================== VALIDATION ====================
function assertValidChatMessage(message) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new AppError("Message is required.", 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`,
      400
    );
  }
}

function detectResponseLanguage(message) {
  const text = String(message || "").toLowerCase();
  return VIETNAMESE_ACCENT_RE.test(text) || VIETNAMESE_WORD_RE.test(text) ? "vi" : "en";
}

// ==================== HELPER FUNCTIONS ====================
async function getPlanetContext(planetName) {
  if (!planetName || !prisma?.planet) return null;

  try {
    return await prisma.planet.findFirst({
      where: { name: { equals: planetName, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        diameterKm: true,        
        avgTempCelsius: true,   
        atmosphere: true,
        hasRings: true,
        numberOfMoons: true,
        distanceFromSunAu: true,
        distanceFromEarthKm: true,
        orbitalPeriodDays: true,
        gravityMs2: true,
        isVisible: true,
        aiFunFacts: true,
        discoveredBy: true,
        discoveryYear: true,
      },
    });
  } catch (error) {
    console.error("Get planet context error:", error.message);
    return null;
  }
}
// ==================== HELPER ====================
const INTENT_TYPE_MAP = {
  planet:         "PLANET_INFO",
  constellation:  "CONSTELLATION_INFO",
  recommendation: "STARGAZING_RECOMMENDATION",
  weather:        "WEATHER_CHECK",
  astronomy:      "GENERAL_ASTRONOMY",
  general:        "GENERAL_ASTRONOMY",
  news:           "UNKNOWN",
  guide:          "UNKNOWN",
  recognition:    "UNKNOWN",
  favorite:       "UNKNOWN",
};

function resolveIntentType(intent) {
  const raw = intent?.primaryIntent?.type || intent?.type || "general";
  return INTENT_TYPE_MAP[raw.toLowerCase()] ?? "UNKNOWN";
}

// ==================== CORE FUNCTIONS ====================
async function createGroqCompletion(messages) {
  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
    });

    return completion.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Groq completion error:", error.message);
    throw new AppError("Failed to generate AI response.", 503);
  }
}

/**
 * Resolve sessionId: dùng sessionId có sẵn hoặc tạo mới
 */
async function resolveSession(userId, sessionId) {
  if (!userId) throw new AppError("User authentication is required.", 401);

  if (sessionId) {
    const session = await getSessionById(sessionId);
    if (!session) throw new AppError("Chat session not found.", 404);
    if (session.userId !== userId) throw new AppError("You do not have access to this chat session.", 403);
    return sessionId;
  }

  const session = await createSession(userId);
  if (!session) throw new AppError("Failed to create chat session.", 500);

  return session.id;
}

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Send message to chatbot
 * @param {string} userId
 * @param {string} message
 * @param {string|null} sessionId - nếu null sẽ tự tạo session mới
 */
async function sendMessage({ userId, message, sessionId }) {
  assertValidChatMessage(message);
  const cleanMessage = message.trim();
  const responseLanguage = detectResponseLanguage(cleanMessage);

  const resolvedSessionId = await resolveSession(userId, sessionId);

  const intent = detectIntent(cleanMessage);         // object đầy đủ
  const intentType = resolveIntentType(intent);      // string enum cho Prisma
  const planetName = extractPlanetName(cleanMessage);

  const [history, planetContext, recommendations] = await Promise.all([
    fetchConversationHistory(resolvedSessionId, DEFAULT_HISTORY_LIMIT),
    getPlanetContext(planetName),
    getPersonalizedRecommendations({
      userId,
      message: cleanMessage,
      intent,   //  truyền object đầy đủ cho recommendation engine
      prisma,
    }),
  ]);

  const messages = buildChatMessages({
    userMessage: cleanMessage,
    intent,       //  truyền object đày đủ cho chat engine
    history,
    context: {
      planet: planetContext,
      recommendations,
      extra: {
        assistantName: "CosmoBot",
        language: responseLanguage === "vi" ? "Vietnamese" : "English",
        instruction:
          responseLanguage === "vi"
            ? "The user is asking in Vietnamese. Answer in natural Vietnamese with proper accents. Be clear, helpful, concise, and focused on astronomy."
            : "The user is asking in English. Answer in English. Be clear, helpful, concise, and focused on astronomy.",
      },
    },
    lang: responseLanguage,
  });

  const assistantMessage = await createGroqCompletion(messages);

  await saveConversation({
    sessionId: resolvedSessionId,
    userMessage: cleanMessage,
    assistantMessage,
    intent: intentType,   
    modelUsed: DEFAULT_MODEL,
  });

  trackAnalyticsEvent({
    userId,
    event: "CHATBOT_MESSAGE",
    entityType: "chat_session",
    entityId: resolvedSessionId,
    entityName: intentType,
    metadata: {
      intent,
      model: DEFAULT_MODEL,
      messageLength: cleanMessage.length,
    },
  }).catch((error) => console.error("[analytics] chatbot track failed:", error.message));

  return {
    reply: assistantMessage,
    intent,               //  trả object đầy đủ về cho frontend nếu cần
    planet: planetContext,
    recommendations,
    sessionId: resolvedSessionId,
  };
}

/**
 * Get chat history theo session
 * @param {string} userId
 * @param {string} sessionId
 * @param {number} limit
 */
async function getConversationHistory({ userId, sessionId, limit = DEFAULT_CHAT_HISTORY_LIMIT }) {
  if (!userId) throw new AppError("User authentication is required.", 401);
  if (!sessionId) throw new AppError("sessionId is required.", 400);

  await resolveSession(userId, sessionId);
  return fetchConversationHistory(sessionId, clampLimit(limit, DEFAULT_CHAT_HISTORY_LIMIT));
}

function clampLimit(value, fallback = DEFAULT_CHAT_HISTORY_LIMIT, max = MAX_CHAT_HISTORY_LIMIT) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

/**
 * Clear chat history (xóa cả session)
 * @param {string} userId
 * @param {string} sessionId
 */
async function clearConversationHistory({ userId, sessionId }) {
  if (!userId) throw new AppError("User authentication is required.", 401);
  if (!sessionId) throw new AppError("sessionId is required.", 400);

  await resolveSession(userId, sessionId);
  const deleted = await deleteSession(sessionId); // cascade delete messages theo session
  if (!deleted) throw new AppError("Failed to clear chat history.", 500);

  return { deleted: true, sessionId };
}

export { sendMessage, getConversationHistory, clearConversationHistory };
