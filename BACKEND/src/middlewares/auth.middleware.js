import prisma from "../config/db.js";
import { sendError } from "../utils/controller.helpers.util.js";
import { verifyToken } from "../utils/jwt.util.js";

const userSessionSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  role: true,
  isActive: true,
};

async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: userSessionSelect,
  });

  return user?.isActive ? { ...user, name: user.displayName || user.username } : null;
}

export const authenticate = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return sendError(res, "Missing or invalid authentication token", 401);

    req.user = user;
    return next();
  } catch {
    return sendError(res, "Token is invalid or expired", 401);
  }
};

export const tryAuthenticate = async (req, res, next) => {
  try {
    req.user = await getUserFromRequest(req);
  } catch {
    req.user = null;
  }
  return next();
};
