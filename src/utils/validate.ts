import { ObjectId } from "mongodb";
import type { z } from "zod";
import { ApiError } from "./api-error.js";

/** Parse with zod and turn failures into a 400 with a readable message. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));
    throw new ApiError(400, issues[0].message, issues);
  }
  return result.data;
}

/** Strict 24-hex check (ObjectId.isValid also accepts any 12 character string). */
export function toObjectId(id: unknown, label = "id"): ObjectId {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    throw new ApiError(400, `Invalid ${label}.`);
  }
  return new ObjectId(id);
}
