/**
 * memory.service.js
 * - Lấy lịch sử hội thoại gần nhất.
 * - Lưu câu hỏi user và câu trả lời AI.
 * - Viết an toàn để không crash nếu Prisma chưa có model chatMessage.
 */

const prisma = require("../../config/db");

const DEFAULT_LIMIT = 10;

async function getConversationHistory(userId, limit = DEFAULT_LIMIT) {
  try {
    if (!userId || !prisma.chatMessage) {
      return [];
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));
  } catch (error) {
    console.error("Get conversation history error:", error.message);
    return [];
  }
}

async function saveMessage({ userId, role, content }) {
  try {
    if (!userId || !role || !content || !prisma.chatMessage) {
      return null;
    }

    return await prisma.chatMessage.create({
      data: {
        userId,
        role,
        content,
      },
    });
  } catch (error) {
    console.error("Save message error:", error.message);
    return null;
  }
}

async function saveConversation({ userId, userMessage, assistantMessage }) {
  try {
    await saveMessage({
      userId,
      role: "user",
      content: userMessage,
    });

    await saveMessage({
      userId,
      role: "assistant",
      content: assistantMessage,
    });

    return true;
  } catch (error) {
    console.error("Save conversation error:", error.message);
    return false;
  }
}

function formatHistoryForPrompt(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No previous conversation.";
  }

  return history
    .map((message) => {
      const role = message.role === "assistant" ? "AI" : "User";
      return `${role}: ${message.content}`;
    })
    .join("\n");
}

module.exports = {
  getConversationHistory,
  saveMessage,
  saveConversation,
  formatHistoryForPrompt,
};