import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import path from "path";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import chatbotRoutes from "./modules/chatbot/chatbot.routes.js";
import planetsRoutes from "./modules/astronomy/planets/planet.routes.js";
import observatoryRoutes from "./modules/observatory/observatory.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import newsRoutes from "./modules/news/news.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import analyticsRoutes from "./services/analytics/analytics.routes.js";

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
app.use("/uploads", express.static(path.join(process.cwd(), "src", "uploads")));
app.use("/constellation-gallery", express.static(path.join(process.cwd(), "ml", "data", "constellations")));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/astronomy/planets", (await import("./modules/astronomy/planets/planet.routes.js")).default);
app.use("/api/astronomy/constellations", (await import("./modules/astronomy/constellations/constellation.routes.js")).default);
const recommendationRoutes = (await import("./modules/recommendation/recommendation.routes.js")).default;
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/recommendation", recommendationRoutes);
app.use("/api/observatory", observatoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);
// Public dashboard (no auth) to support anonymous clients that pass lat/lng
app.use("/api/dashboard-public", (await import("./modules/dashboard/public.routes.js")).default);


// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route không tồn tại" }));

// Error handler
app.use(errorHandler);

export default app;
