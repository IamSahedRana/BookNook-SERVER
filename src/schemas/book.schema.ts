import { z } from "zod";
import { CATEGORIES } from "../types/book.js";

const imageUrl = z
  .string()
  .trim()
  .min(1, "Book image is required")
  .refine((v) => /^https?:\/\/\S+$/i.test(v), "Book image must be a valid http(s) link");

export const createBookSchema = z.object({
  title: z.string().trim().min(1, "Book title is required").max(120, "Title is too long (max 120)"),
  author: z.string().trim().min(1, "Author name is required").max(80, "Author name is too long (max 80)"),
  category: z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(", ")}` }),
  image: imageUrl,
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description is too long (max 1000)"),
  totalCopies: z.coerce
    .number({ error: "Total copies must be a number" })
    .int("Total copies must be a whole number")
    .min(1, "There must be at least 1 copy")
    .max(100, "Total copies can't be more than 100"),
});

/** PATCH: any subset of the fields above, but not an empty body. */
export const updateBookSchema = createBookSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field to update");

export const listBooksQuerySchema = z.object({
  sort: z.enum(["latest"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  email: z.string().trim().toLowerCase().optional(),
});
