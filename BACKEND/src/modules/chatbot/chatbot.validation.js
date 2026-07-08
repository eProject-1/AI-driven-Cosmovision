import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z
    .string({
      required_error: "Message is required",
    })
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message cannot exceed 4000 characters"),
  sessionId: z.string().trim().min(1).optional(),
});
