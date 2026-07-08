import { AppError } from "../utils/app-error.util.js";

/**
 *
 * Sử dụng SAU authMiddleware — yêu cầu req.user đã được gắn vào request.
 * @param {...string} allowedRoles - Một hoặc nhiều role được phép truy cập.
 *
 * @example 
 * // Chỉ ADMIN
 * router.post("/facts/refresh", authMiddleware, roleMiddleware("ADMIN"), handler);
 *
 * @example
 * // ADMIN hoặc MODERATOR
 * router.delete("/", authMiddleware, roleMiddleware("ADMIN", "MODERATOR"), handler);
 */
export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    // authMiddleware phải chạy trước — nếu không có req.user là lỗi setup
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(" or ")}`,
          403
        )
      );
    }

    next();
  };
}