import { verifyToken } from "../utils/jwt.util.js";
import { sendError } from "../utils/response.util.js";
import prisma from "../config/db.js";
import fs from "fs";
import path from "path";

const DEBUG_LOG = path.join(process.cwd(), "auth_debug.log");
function writeDebug(...parts) {
  try {
    fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${parts.join(" ")}\n`);
  } catch (e) {}
}

export const authenticate = async (req, res, next) => {
  // Allow public access to dashboard endpoints (they handle personalization internally)
  try {
    writeDebug('authenticate called', req.method, req.originalUrl, 'auth=', !!req.headers.authorization);
    const orig = req.originalUrl || req.url || '';
    const base = req.baseUrl || '';
    const path = req.path || '';
    // Bypass authentication for any request targeting the dashboard endpoints
    if (orig.startsWith('/api/dashboard') || base.startsWith('/api/dashboard') || path.startsWith('/api/dashboard')) {
      writeDebug('authenticate bypass for dashboard path', orig || base || path);
      return next();
    }
  } catch (e) {}
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
        isActive: true,
      },
    });

    if (!user) return sendError(res, "User does not exist", 401);
    if (!user.isActive) return sendError(res, "Account is disabled", 403);

    req.user = { ...user, name: user.displayName || user.username };
    next();
  } catch {
    return sendError(res, "Token is invalid or expired", 401);
  }
};

export const tryAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    writeDebug('tryAuthenticate called', req.method, req.originalUrl, 'auth=', !!authHeader);
    if (!authHeader?.startsWith("Bearer ")) {
      // No token provided — continue as anonymous
      writeDebug('tryAuthenticate no header, continuing');
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, displayName: true, role: true, isActive: true },
    });

    if (!user) {
      writeDebug('tryAuthenticate user not found for token');
      return next();
    }
    if (!user.isActive) {
      writeDebug('tryAuthenticate inactive user ignored');
      return next();
    }

    req.user = { ...user, name: user.displayName || user.username };
    writeDebug('tryAuthenticate attached user', req.user.id);
    return next();
  } catch (err) {
    // Token invalid — ignore and continue unauthenticated
    writeDebug('tryAuthenticate error', err?.message || err);
    return next();
  }
};
