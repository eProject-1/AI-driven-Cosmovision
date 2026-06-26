import { Router } from "express";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

// Public dashboard endpoint: does not enforce authentication.
router.get("/", getDashboard);

export default router;
