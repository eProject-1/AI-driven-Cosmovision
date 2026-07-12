export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res, message = "Error", statusCode = 400, errors = null) => {
  return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

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
