import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/db.js";
import { startNewsMaintenanceJob } from "./modules/news/news.service.js";

async function startServer() {
  try {
    await prisma.$connect();
    startNewsMaintenanceJob();
    console.log("✅ Database connected");

    app.listen(env.PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${env.PORT}`);
      console.log(`📡 API: http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
