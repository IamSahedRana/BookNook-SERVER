import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  // express.json() could not parse the body
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON in request body." });
  }

  console.error("[error]", error);
  res.status(500).json({ message: "Something went wrong on our side. Please try again." });
}
