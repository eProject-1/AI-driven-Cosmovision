import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(80).optional(),
  avatarUrl: z.string().url("Avatar URL must be valid").optional().nullable(),
  bio: z.string().trim().max(500, "Bio must not exceed 500 characters").optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  timezone: z.string().trim().max(80).optional().nullable(),
  website: z.string().url("Website URL must be valid").optional().nullable(),
});

export const updatePreferencesSchema = z.object({
  favoritesPlanets: z.array(z.string().trim()).optional(),
  favoritesConstellations: z.array(z.string().trim()).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  emailAlerts: z.boolean().optional(),
  eventReminders: z.boolean().optional(),
  temperatureUnit: z.enum(["celsius", "fahrenheit"]).optional(),
  distanceUnit: z.enum(["km", "mi"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
});

export const favoriteTypeSchema = z.enum(["planets", "constellations"]);
