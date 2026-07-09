import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const isUnsafeJwtSecret = !process.env.JWT_SECRET || JWT_SECRET === "fallback_secret" || JWT_SECRET.length < 32;

if (NODE_ENV === "production" && isUnsafeJwtSecret) {
  throw new Error("JWT_SECRET must be set to a strong value of at least 32 characters in production.");
}

if (NODE_ENV !== "production" && isUnsafeJwtSecret) {
  console.warn("[security] Using an unsafe development JWT_SECRET. Set JWT_SECRET before deploying.");
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  PORT: parseInt(process.env.PORT) || 5000,
  API_PUBLIC_URL: process.env.API_PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT) || 5000}`,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLIENT_URLS: (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  NODE_ENV,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || "CosmoVision <no-reply@cosmovision.app>",
  EMAIL_DEV_FALLBACK: (process.env.EMAIL_DEV_FALLBACK || "false") === "true",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "465"),
  SMTP_SECURE: (process.env.SMTP_SECURE || "true") === "true",
  SMTP_NO_AUTH: (process.env.SMTP_NO_AUTH || "false") === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || "60"),
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  GROQ_VISION_MODEL: process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
  GROQ_TEMPERATURE: process.env.GROQ_TEMPERATURE || 0.7,
  GROQ_MAX_TOKENS: process.env.GROQ_MAX_TOKENS || 800,
  MAX_CONSTELLATION_IMAGE_SIZE_MB: parseInt(process.env.MAX_CONSTELLATION_IMAGE_SIZE_MB || "4"),
  MIN_CONSTELLATION_RECOGNITION_CONFIDENCE: Number(process.env.MIN_CONSTELLATION_RECOGNITION_CONFIDENCE || 0.62),
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
