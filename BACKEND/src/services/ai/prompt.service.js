/**
 * prompt.service.js
 * - Build system prompt cho chatbot.
 * - Ghép intent, context, lịch sử chat, dữ liệu planet/weather nếu có.
 */

const { INTENT_TYPES } = require("./intent.service");
const { formatHistoryForPrompt } = require("./memory.service");

function buildBaseSystemPrompt() {
  return `
You are Cosmovision AI, an intelligent astronomy assistant.

Your main responsibilities:
- Explain planets, stars, space, NASA data, weather and astronomy-related knowledge.
- Give clear, friendly and accurate answers.
- Use simple language when the user asks basic questions.
- Use more technical explanations when the user asks advanced questions.
- If the question is not related to astronomy, still answer helpfully but briefly.

Rules:
- Do not invent fake facts.
- If data is missing, clearly say that the data is not available.
- If external API context is provided, prioritize that context.
- Answer in the same language as the user when possible.
`.trim();
}

function buildIntentInstruction(intentType) {
  switch (intentType) {
    case INTENT_TYPES.PLANET:
      return `
The user is asking about planets or astronomy objects.
Use the provided planet context if available.
Explain with facts such as size, orbit, temperature, atmosphere, moons, and interesting details.
`.trim();

    case INTENT_TYPES.WEATHER:
      return `
The user is asking about weather.
Use the provided weather context if available.
Explain temperature, condition, humidity, wind, and forecast clearly.
`.trim();

    case INTENT_TYPES.RECOMMENDATION:
      return `
The user wants recommendations.
Recommend suitable planets, astronomy topics, learning resources, or exploration paths based on the user's question.
Give practical and personalized suggestions.
`.trim();

    case INTENT_TYPES.NEWS:
      return `
The user is asking about space or NASA news.
Use provided news context if available.
Summarize the key points clearly and avoid unsupported claims.
`.trim();

    default:
      return `
The user is asking a general question.
Answer directly and helpfully.
`.trim();
  }
}

function buildContextBlock(context = {}) {
  const contextParts = [];

  if (context.planet) {
    contextParts.push(`
Planet context:
${JSON.stringify(context.planet, null, 2)}
`.trim());
  }

  if (context.weather) {
    contextParts.push(`
Weather context:
${JSON.stringify(context.weather, null, 2)}
`.trim());
  }

  if (context.news) {
    contextParts.push(`
News context:
${JSON.stringify(context.news, null, 2)}
`.trim());
  }

  if (context.recommendations) {
    contextParts.push(`
Recommendation context:
${JSON.stringify(context.recommendations, null, 2)}
`.trim());
  }

  if (context.extra) {
    contextParts.push(`
Extra context:
${typeof context.extra === "string" ? context.extra : JSON.stringify(context.extra, null, 2)}
`.trim());
  }

  return contextParts.length > 0
    ? contextParts.join("\n\n")
    : "No external context provided.";
}

function buildChatMessages({
  userMessage,
  intent,
  history = [],
  context = {},
}) {
  const systemPrompt = buildBaseSystemPrompt();
  const intentInstruction = buildIntentInstruction(intent?.type);
  const historyText = formatHistoryForPrompt(history);
  const contextText = buildContextBlock(context);

  return [
    {
      role: "system",
      content: `
${systemPrompt}

Current intent:
${intent?.type || "general"}

Intent instruction:
${intentInstruction}

Conversation history:
${historyText}

Available context:
${contextText}
`.trim(),
    },
    {
      role: "user",
      content: userMessage,
    },
  ];
}

function buildSinglePrompt({
  userMessage,
  intent,
  history = [],
  context = {},
}) {
  const messages = buildChatMessages({
    userMessage,
    intent,
    history,
    context,
  });

  return messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
}

module.exports = {
  buildBaseSystemPrompt,
  buildIntentInstruction,
  buildContextBlock,
  buildChatMessages,
  buildSinglePrompt,
};
