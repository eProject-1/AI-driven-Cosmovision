import { z } from "zod";

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  },
  z.number().optional()
);

export const createRecommendationSchema = z
  .object({
    latitude: optionalNumber.refine((value) => value === undefined || (value >= -90 && value <= 90), {
      message: "Latitude must be between -90 and 90.",
    }),
    longitude: optionalNumber.refine((value) => value === undefined || (value >= -180 && value <= 180), {
      message: "Longitude must be between -180 and 180.",
    }),
    locationName: z.string().trim().min(2, "Location name must be at least 2 characters.").max(100, "Location name must be at most 100 characters.").optional(),
  })
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;
    const hasCoords = hasLatitude && hasLongitude;
    const hasPartialCoords = hasLatitude !== hasLongitude;
    const hasLocationName = Boolean(value.locationName?.trim());

    if (hasPartialCoords) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasLatitude ? ["longitude"] : ["latitude"],
        message: "Latitude and longitude must be provided together.",
      });
    }

    if (!hasCoords && !hasLocationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationName"],
        message: "Enter a location name or provide both latitude and longitude.",
      });
    }
  });

export const refreshRecommendationParamsSchema = z.object({
  id: z.string({ required_error: "id is required." }).min(1, "id cannot be empty."),
});
