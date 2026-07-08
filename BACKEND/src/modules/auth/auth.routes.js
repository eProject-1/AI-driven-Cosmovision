import { Router } from "express";
import { adminLogin, login, me, register, resendVerification, verifyEmail, verifyEmailLink } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/admin/login", adminLogin);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.get("/verify-email-link", verifyEmailLink);
router.post("/resend-verification", resendVerification);
router.get("/me", authenticate, me);



export default router;
