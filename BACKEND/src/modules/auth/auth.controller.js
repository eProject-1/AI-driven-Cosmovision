import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.util.js";
import { registerUser, loginUser, getMe } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";


export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Dữ liệu không hợp lệ", 400, parsed.error.flatten().fieldErrors);
  }
  const result = await registerUser(parsed.data);
  return sendSuccess(res, result, "Đăng ký thành công", 201);
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Dữ liệu không hợp lệ", 400, parsed.error.flatten().fieldErrors);
  }
  const result = await loginUser(parsed.data);
  return sendSuccess(res, result, "Đăng nhập thành công");
});


export const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id);
  return sendSuccess(res, user);
});
