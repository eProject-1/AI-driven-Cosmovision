import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { sendMessage, getHistory } from "./chatbot.controller.js";

const router = Router();

router.use(authenticate); // tất cả chatbot routes đều cần login

router.post("/", sendMessage);
router.get("/history", getHistory);

export default router;