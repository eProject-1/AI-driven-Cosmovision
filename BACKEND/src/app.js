import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import chatbotRoutes from "./modules/chatbot/chatbot.routes.js";
import planetsRoutes from "./modules/astronomy/planets/planet.routes.js";
import observatoryRoutes from "./modules/observatory/observatory.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import newsRoutes from "./modules/news/news.routes.js";
import userRoutes from "./modules/user/user.routes.js";

const app = express();

import fs from "fs";
import path from "path";
const REQ_LOG = path.join(process.cwd(), 'request_debug.log');
function writeReq(...parts) {
  try { fs.appendFileSync(REQ_LOG, `[${new Date().toISOString()}] ${parts.join(' ')}\n`); } catch (e) {}
}

// Debug: log incoming requests (temporary)
app.use((req, res, next) => {
  try {
    const msg = `[REQ] ${req.method} ${req.originalUrl} Auth=${!!req.headers.authorization}`;
    console.log(msg);
    writeReq(msg);
  } catch (e) {}
  next();
});

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

// Debug process info
app.get('/debug/process', (req, res) => {
  res.json({ pid: process.pid, cwd: process.cwd() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/astronomy/planets", (await import("./modules/astronomy/planets/planet.routes.js")).default);
app.use("/api/astronomy/constellations", (await import("./modules/astronomy/constellations/constellation.routes.js")).default);
app.use("/api/recommendations", (await import("./modules/recommendation/recommendation.routes.js")).default);
app.use("/api/observatory", observatoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
// Public dashboard (no auth) to support anonymous clients that pass lat/lng
app.use("/api/dashboard-public", (await import("./modules/dashboard/public.routes.js")).default);


// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route không tồn tại" }));

// Error handler
app.use(errorHandler);

export default app;
