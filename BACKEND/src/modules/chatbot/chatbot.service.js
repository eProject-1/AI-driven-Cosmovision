import { AppError } from "../../utils/app.error.util.js";
import { formatPlainAiResponse } from "../../utils/ai-response-format.util.js";
import { createLogger } from "../../utils/logger.util.js";
import { clampInteger, requireUserId } from "../../utils/service.util.js";

import { trackAnalyticsEvent } from "../../services/analytics/analytics.service.js";
import {
  detectIntent,
  detectResponseLanguage,
  extractPlanetName,
  toPersistenceIntentType,
} from "../../services/chatbot/intent.service.js";
import {
  createSession,
  deleteSession,
  deleteUserSessions,
  getConversationHistory as fetchConversationHistory,
  getSessionById,
  getUserSessions,
  saveConversation,
} from "../../services/chatbot/memory.service.js";
import { buildChatbotContext } from "../../services/chatbot/context.service.js";
import { createChatCompletion } from "../../services/chatbot/llm.service.js";
import { buildChatMessages } from "../../services/chatbot/prompt.service.js";

const logger = createLogger("chatbot");
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const DEFAULT_TEMPERATURE = Number(process.env.GROQ_TEMPERATURE || 0.7);
const DEFAULT_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 800);
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_HISTORY_LIMIT = 25;
const DEFAULT_CHAT_HISTORY_LIMIT = 20;
const MAX_CHAT_HISTORY_LIMIT = 50;
const DEFAULT_SESSION_LIST_LIMIT = 20;
const MAX_SESSION_LIST_LIMIT = 50;
const AUTH_REQUIRED = "User authentication is required.";
const DEFAULT_SESSION_TITLE = "New Conversation";

export async function sendMessage({ userId, message, sessionId }) {
  requireUserId(userId, AUTH_REQUIRED);
  assertValidChatMessage(message);

  const cleanMessage = message.trim();
  const responseLanguage = detectResponseLanguage(cleanMessage);
  const storageSession = await resolveStorageSession(userId, sessionId);
  const intent = detectIntent(cleanMessage);
  const intentType = toPersistenceIntentType(intent);
  const planetName = extractPlanetName(cleanMessage);

  const [history, runtimeContext] = await Promise.all([
    storageSession.sessionId
      ? fetchConversationHistory(storageSession.sessionId, DEFAULT_HISTORY_LIMIT)
      : Promise.resolve([]),
    buildChatbotContext({ message: cleanMessage, intent, planetName }),
  ]);

  const rawAssistantMessage = await createGroqCompletion(
    buildChatMessages({
      userMessage: cleanMessage,
      intent,
      history,
      context: {
        ...runtimeContext,
        extra: getLanguageInstruction(responseLanguage),
      },
      lang: responseLanguage,
    })
  );
  const assistantMessage = formatPlainAiResponse(rawAssistantMessage, {
    maxLines: 10,
    fallback:
      responseLanguage === "vi"
        ? "Tôi chưa có đủ thông tin để trả lời câu hỏi này."
        : "I do not have enough information to answer that.",
  });

  const saved = storageSession.sessionId
    ? await saveConversation({
        sessionId: storageSession.sessionId,
        userMessage: cleanMessage,
        assistantMessage,
        intent: intentType,
        modelUsed: DEFAULT_MODEL,
      })
    : false;

  if (storageSession.sessionId && !saved) {
    logger.warn("Chat response generated but history save failed", {
      sessionId: storageSession.sessionId,
      userId,
    });
  }

  trackChatbotAnalytics({
    userId,
    sessionId: storageSession.sessionId,
    intent,
    intentType,
    messageLength: cleanMessage.length,
  });

  return {
    reply: assistantMessage,
    sessionId: storageSession.sessionId,
    historyStatus: {
      available: Boolean(storageSession.sessionId),
      saved: Boolean(saved),
      reason: saved ? null : storageSession.reason || "Chat history is temporarily unavailable.",
    },
  };
}

export async function getConversationHistory({ userId, sessionId, limit = DEFAULT_CHAT_HISTORY_LIMIT }) {
  requireUserId(userId, AUTH_REQUIRED);
  if (!sessionId) throw new AppError("sessionId is required.", 400);

  await assertSessionAccess(userId, sessionId);
  return fetchConversationHistory(
    sessionId,
    clampInteger(limit, { fallback: DEFAULT_CHAT_HISTORY_LIMIT, max: MAX_CHAT_HISTORY_LIMIT })
  );
}

export async function listChatSessions({ userId, limit = DEFAULT_SESSION_LIST_LIMIT }) {
  requireUserId(userId, AUTH_REQUIRED);

  const sessions = await getUserSessions(
    userId,
    clampInteger(limit, { fallback: DEFAULT_SESSION_LIST_LIMIT, max: MAX_SESSION_LIST_LIMIT })
  );

  return sessions.map(formatSessionSummary);
}

export async function clearConversationHistory({ userId, sessionId }) {
  requireUserId(userId, AUTH_REQUIRED);
  if (!sessionId) throw new AppError("sessionId is required.", 400);

  await assertSessionAccess(userId, sessionId);
  const deleted = await deleteSession(sessionId);
  if (!deleted) throw new AppError("Failed to clear chat history.", 500);

  return { deleted: true, sessionId };
}

export async function clearAllChatSessions({ userId }) {
  requireUserId(userId, AUTH_REQUIRED);

  const deletedCount = await deleteUserSessions(userId);
  if (deletedCount === null) throw new AppError("Failed to clear chat history.", 500);

  return { deleted: true, deletedCount };
}

function assertValidChatMessage(message) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new AppError("Message is required.", 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(`Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }
}

function getLanguageInstruction(responseLanguage) {
  return {
    assistantName: "CosmoBot",
    language: responseLanguage === "vi" ? "Vietnamese" : "English",
    instruction:
      responseLanguage === "vi"
        ? "The user is asking in Vietnamese. Answer in natural Vietnamese with proper accents. Be clear, helpful, concise, and focused on astronomy."
        : "The user is asking in English. Answer in English. Be clear, helpful, concise, and focused on astronomy.",
  };
}

async function assertSessionAccess(userId, sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) throw new AppError("Chat session not found.", 404);
  if (session.userId !== userId) throw new AppError("You do not have access to this chat session.", 403);
  return session;
}

async function resolveStorageSession(userId, sessionId) {
  if (sessionId) {
    const existingSession = await getSessionById(sessionId);
    if (existingSession?.userId === userId) return { sessionId, reason: null };

    if (existingSession && existingSession.userId !== userId) {
      logger.warn("Ignoring chat session from another user", { sessionId, userId });
    }
  }

  const session = await createSession(userId);
  if (session?.id) return { sessionId: session.id, reason: null };

  logger.warn("Chat storage unavailable; continuing without persisted history", { userId });
  return {
    sessionId: null,
    reason: "Chat history could not be saved right now.",
  };
}

function trackChatbotAnalytics({ userId, sessionId, intent, intentType, messageLength }) {
  if (!sessionId) return;

  trackAnalyticsEvent({
    userId,
    event: "CHATBOT_MESSAGE",
    entityType: "chat_session",
    entityId: sessionId,
    entityName: intentType,
    metadata: {
      intent,
      model: DEFAULT_MODEL,
      messageLength,
    },
  }).catch((error) => logger.error("Analytics chatbot tracking failed", error));
}

function formatSessionSummary(session) {
  const lastMessage = session.messages?.[0] || null;
  const preview = normalizeSessionText(lastMessage?.content);
  const hasGenericTitle = !session.title || session.title === DEFAULT_SESSION_TITLE;

  return {
    id: session.id,
    title: hasGenericTitle ? getSessionTitle(preview) : session.title,
    preview,
    messageCount: session._count?.messages || 0,
    updatedAt: session.updatedAt,
  };
}

function normalizeSessionText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function getSessionTitle(preview = "") {
  if (!preview) return DEFAULT_SESSION_TITLE;
  return preview.length > 54 ? `${preview.slice(0, 54).trim()}...` : preview;
}

async function createGroqCompletion(messages) {
  return createChatCompletion({
    model: DEFAULT_MODEL,
    messages,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
  });
}
