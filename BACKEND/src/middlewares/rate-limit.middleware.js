import { AppError } from "../utils/app.error.util.js";

function getClientKey(req) {
  return req.user?.id || req.ip || req.socket?.remoteAddress || "anonymous";
}

export function createRateLimiter({
  windowMs = 60_000,
  max = 60,
  keyPrefix = "global",
  message = "Too many requests. Please try again later.",
} = {}) {
  const buckets = new Map();

  return (req, _res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientKey(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return next(new AppError(message, 429, {
        retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      }));
    }

    return next();
  };
}

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 20,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again later.",
});

export const aiRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  keyPrefix: "ai",
  message: "Too many AI requests. Please slow down.",
});

export const uploadRateLimit = createRateLimiter({
  windowMs: 10 * 60_000,
  max: 12,
  keyPrefix: "upload",
  message: "Too many image uploads. Please try again later.",
});
