// auth.service.js
import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import { signToken } from "../../utils/jwt.util.js";
import { AppError } from "../../utils/app-error.util.js";
import { createLogger } from "../../utils/logger.util.js";
import {
  assertEmailCanReceiveVerification,
  createVerificationToken,
  getStoredTokenParts,
  hashVerificationToken,
} from "../../utils/email-verification.util.js";
import { sendVerificationEmailOrDevFallback } from "../../services/external/email.service.js";

const logger = createLogger("auth");

const toAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  name: user.displayName || user.username,
  displayName: user.displayName,
  role: user.role,
  avatarUrl: user.avatarUrl,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

const emailDeliveryError = (err) => {
  logger.error("Email delivery failed", err);

  if (err?.code === "SMTP_CONFIG_MISSING") {
    return new AppError(`SMTP config is missing: ${err.missing.join(", ")}`, 503);
  }

  if (err?.code === "EAUTH" || err?.responseCode === 535) {
    return new AppError("SMTP authentication failed. Check SMTP_USER and SMTP_PASS/App Password.", 503);
  }

  if (err?.code === "ECONNECTION" || err?.code === "ETIMEDOUT") {
    return new AppError("Could not connect to SMTP server. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, and network access.", 503);
  }

  return new AppError("Could not send verification email. Please try again later.", 503);
};

const RESEND_COOLDOWN_SECONDS = 60;

const makeUsername = async (email) => {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_]/g, "_") || "user";

  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { username: base },
        { username: { startsWith: `${base}_` } },
      ],
    },
    select: { username: true },
  });

  const usernameSet = new Set(existingUsers.map((u) => u.username));
  if (!usernameSet.has(base)) return base;

  let index = 1;
  while (usernameSet.has(`${base}_${index}`)) index++;
  return `${base}_${index}`;
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  await assertEmailCanReceiveVerification(email);

  const passwordHash = await bcrypt.hash(password, 10);
  const verification = createVerificationToken();
  let user;

  try {
    user = await prisma.user.create({
      data: {
        email,
        username: await makeUsername(email),
        passwordHash,
        displayName: name,
        role: "USER",
        isVerified: false,
        verificationToken: verification.storedToken,
        profile: { create: {} },
        preferences: { create: {} },
      },
    });

    let emailResult;
    try {
      emailResult = await sendVerificationEmailOrDevFallback({
        to: user.email,
        name: user.displayName || user.username,
        token: verification.token,
      });
    } catch (err) {
      throw emailDeliveryError(err);
    }

    return {
      user: toAuthUser(user),
      verificationRequired: true,
      verificationEmailSent: emailResult.sent,
      ...(emailResult.verificationUrl && { verificationUrl: emailResult.verificationUrl }),
    };
  } catch (err) {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
    }

    if (err.code === "P2002") {
      throw new AppError("Email already exists", 409);
    }
    throw err;
  }
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const isValidPassword =
    user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !isValidPassword) {
    throw new AppError("Email or password is incorrect", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is disabled", 403);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toAuthUser(user), token };
};

export const loginAdminUser = async ({ email, password }) => {
  const result = await loginUser({ email, password });
  if (result.user.role !== "ADMIN") {
    throw new AppError("Admin access required.", 403);
  }
  return result;
};

export const verifyEmailToken = async ({ token }) => {
  const tokenHash = hashVerificationToken(token);
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: {
        startsWith: `${tokenHash}:`,
      },
    },
  });

  if (!user) {
    throw new AppError("Verification link is invalid or has already been used.", 400);
  }

  const { expiresAt } = getStoredTokenParts(user.verificationToken);
  if (!expiresAt || expiresAt < Date.now()) {
    throw new AppError("Verification link has expired. Please request a new email.", 400);
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
    },
  });

  return { user: toAuthUser(verifiedUser) };
};

export const resendVerificationEmail = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isVerified) {
    return { verificationRequired: false };
  }

  await assertEmailCanReceiveVerification(email);

  const secondsSinceLastUpdate = Math.floor((Date.now() - user.updatedAt.getTime()) / 1000);
  if (secondsSinceLastUpdate < RESEND_COOLDOWN_SECONDS) {
    const retryAfterSeconds = RESEND_COOLDOWN_SECONDS - secondsSinceLastUpdate;
    throw new AppError("Please wait before requesting another verification email.", 429, {
      retryAfterSeconds,
    });
  }

  const verification = createVerificationToken();
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: verification.storedToken },
  });

  let emailResult;
  try {
    emailResult = await sendVerificationEmailOrDevFallback({
      to: updatedUser.email,
      name: updatedUser.displayName || updatedUser.username,
      token: verification.token,
    });
  } catch (err) {
    throw emailDeliveryError(err);
  }

  return {
    verificationRequired: true,
    verificationEmailSent: emailResult.sent,
    ...(emailResult.verificationUrl && { verificationUrl: emailResult.verificationUrl }),
  };
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return user ? toAuthUser(user) : null;
};
