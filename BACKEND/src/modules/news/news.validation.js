import { z } from "zod";

export const getNewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const fetchNewsSchema = z.object({
  query: z.string().trim().optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  retentionDays: z.coerce.number().int().min(1).max(3650).optional(),
});

export const summarizeNewsSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const cleanupNewsSchema = z.object({
  retentionDays: z.coerce.number().int().min(1).max(3650).optional(),
});

export const newsAiRequestSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const newsQuestionSchema = z.object({
  question: z.string().trim().min(3, "Question must be at least 3 characters").max(500),
});
