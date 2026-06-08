import express from "express";

import chatbotRoutes
from "../modules/chatbot/chatbot.routes.js";

const router =
  express.Router();

router.use(
  "/chatbot",
  chatbotRoutes
);

export default router;