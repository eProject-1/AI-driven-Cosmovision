/**
 * observatory.validation.js
 *
 * Zod schemas cho Observatory module.
 * Dùng với validate middleware: validate(schema) → req.body / req.query đã được parse.
 *
 * Note: validate.middleware.js hiện chỉ parse req.body.
 * Query params được validate thủ công trong service (đủ dùng cho GET params).
 */

import { z } from "zod";

// ─── Query: GET /api/observatory ──────────────────────────────────────────────

export const listQuerySchema = z.object({
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : 20))
    .pipe(z.number().int().min(1).max(50)),
});

// ─── Query: GET /api/observatory/nearby ───────────────────────────────────────

export const nearbyQuerySchema = z.object({
  lat: z
    .string({ required_error: "lat là bắt buộc" })
    .transform((v) => parseFloat(v))
    .pipe(z.number().min(-90).max(90, "lat phải trong khoảng -90 đến 90")),

  lon: z
    .string({ required_error: "lon là bắt buộc" })
    .transform((v) => parseFloat(v))
    .pipe(z.number().min(-180).max(180, "lon phải trong khoảng -180 đến 180")),

  radius: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : 100))
    .pipe(z.number().min(1).max(500, "radius tối đa 500 km")),
});
