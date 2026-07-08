import { AppError } from "./app-error.util.js";

export function clampInteger(value, { fallback = 10, min = 1, max = 50 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return Math.min(parsed, max);
}

export function clampUnitInterval(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

export function requireUserId(userId, message = "User authentication is required") {
  if (!userId) throw new AppError(message, 401);
  return userId;
}

export function stripJsonFences(raw = "") {
  return String(raw).replace(/```json|```/gi, "").trim();
}
