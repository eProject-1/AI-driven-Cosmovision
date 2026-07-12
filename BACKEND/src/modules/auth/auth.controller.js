import { asyncHandler } from "../../utils/controller.helpers.util.js";
import { sendSuccess } from "../../utils/controller.helpers.util.js";
import { parseOrSendError } from "../../utils/controller.helpers.util.js";
import {
  getMe,
  loginAdminUser,
  loginUser,
  registerUser,
  resendVerificationEmail,
  verifyEmailToken,
} from "./auth.service.js";
import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "./auth.validation.js";

const invalidDataMessage = "Du lieu khong hop le";
const getClientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

export const register = asyncHandler(async (req, res) => {
  const body = parseOrSendError(registerSchema, req.body, res, invalidDataMessage);
  if (!body) return;

  const result = await registerUser(body);
  return sendSuccess(res, result, "Registration successful. Please verify your email.", 201);
});

export const login = asyncHandler(async (req, res) => {
  const body = parseOrSendError(loginSchema, req.body, res, invalidDataMessage);
  if (!body) return;

  const result = await loginUser(body);
  return sendSuccess(res, result, "Dang nhap thanh cong");
});

export const adminLogin = asyncHandler(async (req, res) => {
  const body = parseOrSendError(loginSchema, req.body, res, invalidDataMessage);
  if (!body) return;

  const result = await loginAdminUser(body);
  return sendSuccess(res, result, "Admin login successful");
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const body = parseOrSendError(verifyEmailSchema, req.body, res, invalidDataMessage);
  if (!body) return;

  const result = await verifyEmailToken(body);
  return sendSuccess(res, result, "Email verified successfully.");
});

export const verifyEmailLink = asyncHandler(async (req, res) => {
  const parsed = verifyEmailSchema.safeParse({ token: req.query.token });
  const clientUrl = getClientUrl();

  if (!parsed.success) {
    return res.redirect(`${clientUrl}/login?verified=0`);
  }

  try {
    await verifyEmailToken(parsed.data);
    return res.redirect(`${clientUrl}/login?verified=1`);
  } catch {
    return res.redirect(`${clientUrl}/login?verified=0`);
  }
});

export const resendVerification = asyncHandler(async (req, res) => {
  const body = parseOrSendError(resendVerificationSchema, req.body, res, invalidDataMessage);
  if (!body) return;

  const result = await resendVerificationEmail(body);
  return sendSuccess(res, result, "If this account needs verification, a new email has been sent.");
});

export const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id);
  return sendSuccess(res, user);
});
