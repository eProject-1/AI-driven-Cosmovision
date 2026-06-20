import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sendMessageSchema } from "./chatbot.validation.js";

import {
  sendMessage,
  getConversationHistory,
  clearConversationHistory,
} from "./chatbot.controller.js";

const router = Router();

router.post("/message", authenticate, validate(sendMessageSchema), sendMessage);
router.get("/history", authenticate, getConversationHistory);
router.delete("/history", authenticate, clearConversationHistory);

export default router;