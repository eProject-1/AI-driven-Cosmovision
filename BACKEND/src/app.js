import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import chatbotRoutes from "./modules/chatbot/chatbot.routes.js";
import planetsRoutes from "./modules/astronomy/planets/planet.routes.js";
import observatoryRoutes from "./modules/observatory/observatory.routes.js";

const app = express();

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CLIENT_URLS.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/astronomy/planets", (await import("./modules/astronomy/planets/planet.routes.js")).default);
app.use("/api/astronomy/constellations", (await import("./modules/astronomy/constellations/constellation.routes.js")).default);
app.use("/api/recommendations", (await import("./modules/recommendation/recommendation.routes.js")).default);
app.use("/api/observatory", observatoryRoutes);


// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route không tồn tại" }));

// Error handler
app.use(errorHandler);

export default app;
