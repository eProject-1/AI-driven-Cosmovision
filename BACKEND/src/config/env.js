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
  DEFAULT_LOCATION_LATITUDE: parseFloat(process.env.DEFAULT_LOCATION_LATITUDE || "21.0285"),
  DEFAULT_LOCATION_LONGITUDE: parseFloat(process.env.DEFAULT_LOCATION_LONGITUDE || "105.8542"),
  DEFAULT_LOCATION_NAME: process.env.DEFAULT_LOCATION_NAME || "Hanoi, Vietnam",
  DEFAULT_LOCATION_TIMEZONE: process.env.DEFAULT_LOCATION_TIMEZONE || "Asia/Ho_Chi_Minh",
  WEATHER_CACHE_TTL_MINUTES: parseInt(process.env.WEATHER_CACHE_TTL_MINUTES || "60"),
  NASA_API_KEY: process.env.NASA_API_KEY,
  NEWS_RETENTION_DAYS: parseInt(process.env.NEWS_RETENTION_DAYS || "60"),
  NEWS_AUTO_FETCH_ENABLED: (process.env.NEWS_AUTO_FETCH_ENABLED || "true") === "true",
  NEWS_AUTO_FETCH_INTERVAL_MINUTES: parseInt(process.env.NEWS_AUTO_FETCH_INTERVAL_MINUTES || "720"),
};
