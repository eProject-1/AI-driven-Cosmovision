import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  PORT: parseInt(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLIENT_URLS: (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  NODE_ENV: process.env.NODE_ENV || "development",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  GROQ_TEMPERATURE: process.env.GROQ_TEMPERATURE || 0.7,
  GROQ_MAX_TOKENS: process.env.GROQ_MAX_TOKENS || 800,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  WEATHER_CACHE_TTL_MINUTES: parseInt(process.env.WEATHER_CACHE_TTL_MINUTES || "60"),
  NASA_API_KEY: process.env.NASA_API_KEY,
};
