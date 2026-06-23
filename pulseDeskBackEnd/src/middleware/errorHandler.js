import { env } from "../config/env.js";

export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = err.name === "TokenExpiredError" ? "Authentication token has expired" : "Invalid authentication token";
  }

  const payload = {
    success: false,
    message
  };

  if (err.details) payload.details = err.details;
  if (env.nodeEnv !== "production") payload.stack = err.stack;

  res.status(statusCode).json(payload);
};
