import prisma from "../../config/db.js";
import { createLogger } from "../../utils/logger.util.js";

const logger = createLogger("chatbot-memory");
const DEFAULT_HISTORY_LIMIT = 25;
const DEFAULT_SESSION_TITLE = "New Conversation";

async function getConversationHistory(sessionId, limit = DEFAULT_HISTORY_LIMIT) {
  try {
    if (!sessionId) return [];

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, role: true, content: true },
    });

    return messages.reverse();
  } catch (error) {
    logger.error("Get conversation history failed", error);
    return [];
  }
}

async function getUserSessions(userId, limit = 10) {
  try {
    if (!userId) return [];

    return await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    });
  } catch (error) {
    logger.error("Get user sessions failed", error);
    return [];
  }
}

async function getSessionById(sessionId) {
  try {
    if (!sessionId) return null;

    return await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { messages: true } } },
    });
  } catch (error) {
    logger.error("Get session by id failed", error);
    return null;
  }
}

async function createSession(userId) {
  try {
    if (!userId) return null;

    return await prisma.chatSession.create({
      data: { userId, title: DEFAULT_SESSION_TITLE },
    });
  } catch (error) {
    logger.error("Create session failed", error);
    return null;
  }
}

async function saveConversation({
  sessionId,
  userMessage,
  assistantMessage,
  intent = "UNKNOWN",
  modelUsed = "llama-3.1-8b-instant",
  userTokens = null,
  assistantTokens = null,
}) {
  try {
    if (!sessionId) return false;

    await prisma.$transaction(async (tx) => {
      const session = await tx.chatSession.findUnique({
        where: { id: sessionId },
        select: { title: true },
      });
      const shouldUpdateTitle = isGenericSessionTitle(session?.title);

      await tx.chatMessage.create({
        data: { sessionId, role: "user", content: userMessage, intent, tokensUsed: userTokens },
      });

      await tx.chatMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: assistantMessage,
          modelUsed,
          tokensUsed: assistantTokens,
        },
      });

      await tx.chatSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
          ...(shouldUpdateTitle && { title: buildSessionTitle(userMessage) }),
        },
      });
    });

    return true;
  } catch (error) {
    logger.error("Save conversation failed", error);
    return false;
  }
}

async function deleteSession(sessionId) {
  try {
    if (!sessionId) return false;

    await prisma.chatSession.delete({ where: { id: sessionId } });
    return true;
  } catch (error) {
    logger.error("Delete session failed", error);
    return false;
  }
}

async function deleteUserSessions(userId) {
  try {
    if (!userId) return null;

    const result = await prisma.chatSession.deleteMany({ where: { userId } });
    return result.count || 0;
  } catch (error) {
    logger.error("Delete user sessions failed", error);
    return null;
  }
}

function isGenericSessionTitle(title) {
  return !title || title === DEFAULT_SESSION_TITLE;
}

function buildSessionTitle(message = "") {
  const title = String(message).replace(/\s+/g, " ").trim();
  if (!title) return DEFAULT_SESSION_TITLE;
  return title.length > 64 ? `${title.slice(0, 61).trim()}...` : title;
}

export {
  getConversationHistory,
  getUserSessions,
  getSessionById,
  createSession,
  saveConversation,
  deleteSession,
  deleteUserSessions,
};
