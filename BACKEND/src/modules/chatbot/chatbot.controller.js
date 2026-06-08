import * as chatbotService
from "./chatbot.service.js";

export const chat = async (
  req,
  res,
  next
) => {
  try {
    const { message } =
      req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message:
          "Message is required",
      });
    }

    const result =
      await chatbotService.chat(
        message
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};