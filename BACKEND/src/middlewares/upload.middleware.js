import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "../utils/AppError.js";

const MAX_IMAGE_SIZE_BYTES = Number(process.env.MAX_CONSTELLATION_IMAGE_SIZE_MB || 4) * 1024 * 1024;
const UPLOAD_ROOT = path.join(process.cwd(), "src", "uploads");
const CONSTELLATION_UPLOAD_DIR = path.join(UPLOAD_ROOT, "constellations");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

fs.mkdirSync(CONSTELLATION_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONSTELLATION_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

function imageFileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    return cb(new AppError("Only JPEG, PNG, WEBP, HEIC, and HEIF images are supported.", 415));
  }
  return cb(null, true);
}

const constellationImageUploader = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

export const uploadConstellationImage = (req, res, next) => {
  constellationImageUploader.single("image")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`, 413));
      }
      return next(new AppError(error.message, 400));
    }

    return next(error);
  });
};

export function buildUploadedFileUrl(req, file) {
  return `${req.protocol}://${req.get("host")}/uploads/constellations/${file.filename}`;
}
