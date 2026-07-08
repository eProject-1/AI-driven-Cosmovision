import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email khong hop le");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ten toi thieu 2 ky tu")
    .max(50, "Ten toi da 50 ky tu"),
  email: emailSchema,
  password: z.string().min(8, "Mat khau toi thieu 8 ky tu"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Vui long nhap mat khau"),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(32, "Token xac thuc khong hop le"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});
