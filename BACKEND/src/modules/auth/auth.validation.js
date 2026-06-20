
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email không hợp lệ");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên tối thiểu 2 ký tự")
    .max(50, "Tên tối đa 50 ký tự"),
  email: emailSchema,
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});