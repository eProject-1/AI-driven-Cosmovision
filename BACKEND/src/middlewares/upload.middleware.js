import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import { env } from "../config/env.js";
import { AppError } from "../utils/app.error.util.js";

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

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

const sharpFormatByMimeType = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heif",
  "image/heif": "heif",
};

fs.mkdirSync(CONSTELLATION_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONSTELLATION_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extensionByMimeType[file.mimetype] || ".jpg";
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

async function removeUploadedFile(file) {
  if (!file?.path) return;
  await fsPromises.unlink(file.path).catch(() => null);
}

async function validateUploadedImageContent(file) {
  if (!file) return;

  try {
    const metadata = await sharp(file.path, { failOn: "error" }).metadata();
    const expectedFormat = sharpFormatByMimeType[file.mimetype];

    if (!metadata.width || !metadata.height || metadata.width > 10_000 || metadata.height > 10_000) {
      throw new AppError("Image dimensions are invalid or too large.", 415);
    }

    if (expectedFormat && metadata.format !== expectedFormat) {
      throw new AppError("Image content does not match the declared file type.", 415);
    }
  } catch (error) {
    await removeUploadedFile(file);
    if (error instanceof AppError) throw error;
    throw new AppError("Uploaded file is not a valid supported image.", 415);
  }
}

export const uploadConstellationImage = (req, res, next) => {
  constellationImageUploader.single("image")(req, res, async (error) => {
    if (!error) {
      try {
        await validateUploadedImageContent(req.file);
        return next();
      } catch (validationError) {
        return next(validationError);
      }
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`, 413));
      }
      return next(new AppError(error.message, 400));
    }

    return next(error);
  });
};

export function buildUploadedFileUrl(_req, file) {
  return `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/constellations/${file.filename}`;
}
