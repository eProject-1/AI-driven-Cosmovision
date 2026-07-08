import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getMissingSmtpConfig = () => {
  const missing = [];
  if (!env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!env.SMTP_PORT) missing.push("SMTP_PORT");
  if (!env.EMAIL_FROM) missing.push("EMAIL_FROM");
  if (!env.SMTP_NO_AUTH && !env.SMTP_USER) missing.push("SMTP_USER");
  if (!env.SMTP_NO_AUTH && !env.SMTP_PASS) missing.push("SMTP_PASS");
  return missing;
};

const assertSmtpConfig = () => {
  const missing = getMissingSmtpConfig();
  if (missing.length > 0) {
    const error = new Error(`SMTP is not configured. Missing: ${missing.join(", ")}`);
    error.code = "SMTP_CONFIG_MISSING";
    error.missing = missing;
    throw error;
  }
};

const createTransporter = () => {
  assertSmtpConfig();

  const transportOptions = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
  };

  if (env.SMTP_USER && env.SMTP_PASS) {
    transportOptions.auth = {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    };
  }

  return nodemailer.createTransport(transportOptions);
};

export const buildEmailVerificationUrl = (token) => {
  const apiUrl = env.API_PUBLIC_URL.replace(/\/$/, "");
  return `${apiUrl}/api/auth/verify-email-link?token=${encodeURIComponent(token)}`;
};

export const sendVerificationEmail = async ({ to, name, token }) => {
  const verificationUrl = buildEmailVerificationUrl(token);
  const transporter = createTransporter();
  const safeName = escapeHtml(name || "Explorer");
  const ttlMinutes = env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES;

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Verify your CosmoVision email",
    text: [
      `Hi ${name || "Explorer"},`,
      "",
      "Welcome to CosmoVision. Confirm your email address to finish creating your account:",
      verificationUrl,
      "",
      `This link expires in ${ttlMinutes} minutes.`,
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;padding:32px 18px;">
          <div style="background:#020617;border-radius:18px;padding:28px;border:1px solid #1e293b;">
            <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#67e8f9;font-weight:700;">CosmoVision</div>
            <h1 style="margin:14px 0 10px;color:#ffffff;font-size:26px;line-height:1.25;">Verify your email</h1>
            <p style="margin:0 0 18px;color:#cbd5e1;line-height:1.6;">Hi ${safeName}, welcome aboard. Confirm this email address to finish creating your account and sign in.</p>
            <a href="${verificationUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700;">
              Verify email
            </a>
            <p style="margin:20px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">This link expires in ${ttlMinutes} minutes. If the button does not work, paste this URL into your browser:</p>
            <p style="word-break:break-all;color:#bae6fd;font-size:13px;line-height:1.6;">${verificationUrl}</p>
          </div>
          <p style="margin:16px 0 0;color:#64748b;font-size:12px;line-height:1.5;">If you did not create this account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });

  return { sent: true };
};

export const sendVerificationEmailOrDevFallback = async ({ to, name, token }) => {
  const verificationUrl = buildEmailVerificationUrl(token);

  if (env.EMAIL_DEV_FALLBACK && env.NODE_ENV !== "production") {
    const missing = getMissingSmtpConfig();
    if (missing.length > 0) {
      console.log("[EMAIL DEV] Verification email not sent because SMTP is incomplete.");
      console.log(`[EMAIL DEV] Missing: ${missing.join(", ")}`);
      console.log(`[EMAIL DEV] To: ${to}`);
      console.log(`[EMAIL DEV] Verify URL: ${verificationUrl}`);
      return { sent: false, verificationUrl };
    }
  }

  return sendVerificationEmail({ to, name, token });
};

export const verifyEmailTransport = async () => {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
};
