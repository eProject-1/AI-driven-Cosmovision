import { Router } from "express";
import { tryAuthenticate } from "../../middlewares/auth.middleware.js";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

// Dashboard allows anonymous access; attach user when present, but do not require auth.
router.get("/", tryAuthenticate, getDashboard);

export default router;