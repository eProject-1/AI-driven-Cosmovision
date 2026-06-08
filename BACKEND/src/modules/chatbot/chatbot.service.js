import groq from "../../config/groq.js";

import { detectIntent } from "./intent.service.js";

import { buildPrompt } from "./prompt.service.js";

export const chat = async (
  message
) => {
  const intent =
    detectIntent(message);

  const messages =
    buildPrompt(message, intent);

  const completion =
    await groq.chat.completions.create({
      model:
        "llama-3.3-70b-versatile",

      messages,

      temperature: 0.7,

      max_tokens: 1000,
    });

  return {
    intent,

    answer:
      completion.choices[0]
      .message.content,
  };
};