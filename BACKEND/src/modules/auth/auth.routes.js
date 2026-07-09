import { Router } from "express";
import { adminLogin, login, me, register, resendVerification, verifyEmail, verifyEmailLink } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authRateLimit } from "../../middlewares/rate-limit.middleware.js";

const router = Router();

router.post("/register", authRateLimit, register);
router.post("/admin/login", authRateLimit, adminLogin);
router.post("/login", authRateLimit, login);
router.post("/verify-email", verifyEmail);
router.get("/verify-email-link", verifyEmailLink);
router.post("/resend-verification", authRateLimit, resendVerification);
router.get("/me", authenticate, me);



export default router;
