
import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "./app.error.util.js";

const TOKEN_SEPARATOR = ":";

const disposableDomains = new Set([
  "10minutemail.com",
  "20minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "sharklasers.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
]);

export const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60 * 1000;

  return {
    token,
    storedToken: `${tokenHash}${TOKEN_SEPARATOR}${expiresAt}`,
    expiresAt: new Date(expiresAt),
  };
};

export const hashVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const getStoredTokenParts = (storedToken) => {
  const [tokenHash, expiresAt] = String(storedToken || "").split(TOKEN_SEPARATOR);
  return { tokenHash, expiresAt: Number(expiresAt) };
};

export const assertEmailCanReceiveVerification = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) {
    throw new AppError("Email is invalid", 400);
  }

  if (disposableDomains.has(domain)) {
    throw new AppError("Please use a real email address, not a temporary email.", 400);
  }
};
