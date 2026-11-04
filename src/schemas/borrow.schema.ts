import { z } from "zod";

export const createBorrowSchema = z.object({
  bookId: z.string({ error: "bookId is required" }).min(1, "bookId is required"),
});
