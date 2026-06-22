import { z } from "zod";

export const createRecommendationSchema = z.object({
  latitude: z
    .number({ required_error: "Vĩ độ (latitude) là bắt buộc" })
    .min(-90, "Vĩ độ phải từ -90 đến 90")
    .max(90, "Vĩ độ phải từ -90 đến 90"),

  longitude: z
    .number({ required_error: "Kinh độ (longitude) là bắt buộc" })
    .min(-180, "Kinh độ phải từ -180 đến 180")
    .max(180, "Kinh độ phải từ -180 đến 180"),

  locationName: z
    .string()
    .trim()
    .max(100, "Tên địa điểm tối đa 100 ký tự")
    .optional(),
});

/**
 * Validate :id trong route POST /api/recommendations/:id/refresh
 * cuid của Prisma có độ dài cố định 25 ký tự, bắt đầu bằng "c".
 * Dùng regex đơn giản để chặn id rác sớm, tránh query DB vô ích.
 */
export const refreshRecommendationParamsSchema = z.object({
  id: z
    .string({ required_error: "id là bắt buộc" })
    .min(1, "id không được để trống"),
});