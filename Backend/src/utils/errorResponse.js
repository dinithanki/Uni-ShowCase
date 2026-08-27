const internalErrorNames = new Set([
  "CastError",
  "MongoServerError",
  "MongoError",
  "ValidationError",
]);

const sendError = (
  res,
  error,
  statusCode = 500,
  fallback = "Request failed",
) => {
  const status =
    Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600
      ? statusCode
      : 500;

  console.error("Request error:", error.stack || error.message || error);

  const message =
    status >= 500 || internalErrorNames.has(error.name)
      ? status >= 500
        ? "Internal server error"
        : "Invalid request"
      : error.message || fallback;

  return res.status(status).json({ message });
};

module.exports = { sendError };
