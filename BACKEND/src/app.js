import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import astronomyRoutes from "./modules/astronomy/astronomy.routes.js";
import chatbotRoutes from "./modules/chatbot/chatbot.routes.js";

const app = express();

// Middleware
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/astronomy", astronomyRoutes);
app.use("/api/chatbot", chatbotRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route không tồn tại" }));

// Error handler
app.use(errorHandler);

export default app;