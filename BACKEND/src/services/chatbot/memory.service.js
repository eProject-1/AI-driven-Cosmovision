import prisma from "../../config/db.js";

const DEFAULT_LIMIT = 25; // Giữ trong khoảng 20-30 để phù hợp context window LLM (llama3-8b)

async function getConversationHistory(sessionId, limit = DEFAULT_LIMIT) {
  try {
    if (!sessionId) return [];

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { role: true, content: true },
    });

    return messages.reverse();
  } catch (error) {
    console.error("Get conversation history error:", error.message);
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
      include: { _count: { select: { messages: true } } },
    });
  } catch (error) {
    console.error("Get user sessions error:", error.message);
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
    console.error("Get session by id error:", error.message);
    return null;
  }
}

async function createSession(userId, title = null) {
  try {
    if (!userId) return null;
    return await prisma.chatSession.create({
      data: { userId, title: title || "New Conversation" },
    });
  } catch (error) {
    console.error("Create session error:", error.message);
    return null;
  }
}

async function updateSessionTitle(sessionId, title) {
  try {
    if (!sessionId || !title?.trim()) return null;
    return await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.trim() },
    });
  } catch (error) {
    console.error("Update session title error:", error.message);
    return null;
  }
}

async function saveMessage({ sessionId, role, content, intent = "UNKNOWN", tokensUsed = null, modelUsed = null }) {
  try {
    if (!sessionId || !role || !content) return null;

    const lowerRole = role.toLowerCase().trim();
    if (!["user", "assistant"].includes(lowerRole)) {
      throw new Error(`Invalid role: ${role}. Only "user" or "assistant" allowed.`);
    }

    return await prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          sessionId,
          role: lowerRole, 
          content,
          intent,
          tokensUsed,
          modelUsed: lowerRole === "assistant" ? (modelUsed || "llama-3.1-8b-instant") : null,
        },
      });

      await tx.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  } catch (error) {
    console.error("Save message error:", error.message);
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
      await tx.chatMessage.create({
        data: { sessionId, role: "user", content: userMessage, intent, tokensUsed: userTokens },
      });

      await tx.chatMessage.create({
        data: { sessionId, role: "assistant", content: assistantMessage, modelUsed, tokensUsed: assistantTokens },
      });

      await tx.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    });

    return true;
  } catch (error) {
    console.error("Save conversation error:", error.message);
    return false;
  }
}

async function deleteSession(sessionId) {
  try {
    if (!sessionId) return false;
    await prisma.chatSession.delete({ where: { id: sessionId } });
    return true;
  } catch (error) {
    console.error("Delete session error:", error.message);
    return false;
  }
}

function formatHistoryForPrompt(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No previous conversation.";
  }

  return history
    .filter(msg => msg && msg.content && msg.role)
    .map((msg) => {
      const displayRole = msg.role.toLowerCase() === "assistant" ? "Assistant" : "User";
      return `${displayRole}: ${msg.content}`;
    })
    .join("\n");
}

export {
  getConversationHistory,
  getUserSessions,
  getSessionById,
  createSession,
  updateSessionTitle,
  saveMessage,
  saveConversation,
  deleteSession,
  formatHistoryForPrompt,
};