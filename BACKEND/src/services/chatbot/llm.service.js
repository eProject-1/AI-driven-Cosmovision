import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";

const logger = createLogger("chatbot-llm");

let groqClient = null;

async function createChatCompletion({ model, messages, temperature, maxTokens }) {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Groq completion failed", error);
    throw new AppError("Failed to generate AI response.", 503);
  }
}

function getGroqClient() {
  if (!env.GROQ_API_KEY) {
    throw new AppError("Chatbot AI provider is not configured.", 503);
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  return groqClient;
}

export { createChatCompletion };
