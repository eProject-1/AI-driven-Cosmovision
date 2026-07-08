import { sendError } from "./response.util.js";

export const parseOrSendError = (
  schema,
  value,
  res,
  message = "Validation failed",
  { includeErrors = true } = {}
) => {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;

  sendError(res, message, 400, includeErrors ? parsed.error.flatten().fieldErrors : null);
  return null;
};
