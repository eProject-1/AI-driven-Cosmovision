export function createLogger(scope) {
  const prefix = scope ? `[${scope}]` : "[app]";

  return {
    info(message, meta) {
      console.log(prefix, message, formatMeta(meta));
    },
    warn(message, meta) {
      console.warn(prefix, message, formatMeta(meta));
    },
    error(message, error) {
      console.error(prefix, message, formatError(error));
    },
  };
}

function formatError(error) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) return error.message;
  return error;
} 

function formatMeta(meta) {
  return meta ?? "";
}
