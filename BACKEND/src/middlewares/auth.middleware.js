import { verifyToken } from "../utils/jwt.util.js";
import { sendError } from "../utils/response.util.js";
import prisma from "../config/db.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return sendError(res, "Missing authentication token", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true, 
        displayName: true,
        role: true,
      },
    });

    if (!user) return sendError(res, "User does not exist", 401);

    req.user = { ...user, name: user.displayName || user.username };
    next();
  } catch {
    return sendError(res, "Token is invalid or expired", 401);
  }
};
