import type { Request, Response } from "express";
import type { Filter } from "mongodb";
import { books, borrows } from "../config/db.js";
import { listBooksQuerySchema, createBookSchema, updateBookSchema } from "../schemas/book.schema.js";
import { serializeBook } from "../serializers.js";
import type { BookDoc } from "../types/book.js";
import { ApiError } from "../utils/api-error.js";
import { parse, toObjectId } from "../utils/validate.js";

function currentUser(req: Request) {
  if (!req.user) throw new ApiError(401, "Please log in to continue.");
  return req.user;
}

/** GET /books (public). ?sort=latest&limit=6  and  ?email=you@example.com */
export async function listBooks(req: Request, res: Response) {
  const { limit, email } = parse(listBooksQuerySchema, req.query);

  const filter: Filter<BookDoc> = email ? { userEmail: email } : {};
  // Newest first. For New Arrivals the client sends sort=latest&limit=6 and MongoDB does the work.
  let cursor = books().find(filter).sort({ addedAt: -1, _id: -1 });
  if (limit) cursor = cursor.limit(limit);

  res.json((await cursor.toArray()).map(serializeBook));
}

/** GET /books/:id (login required) */
export async function getBook(req: Request, res: Response) {
  const book = await books().findOne({ _id: toObjectId(req.params.id, "book id") });
  if (!book) throw new ApiError(404, "Book not found.");
  res.json(serializeBook(book));
}

/** POST /books (login required) */
export async function createBook(req: Request, res: Response) {
  const user = currentUser(req);
  const data = parse(createBookSchema, req.body);

  const book: Omit<BookDoc, "_id"> = {
    ...data,
    availableCopies: data.totalCopies, // a new book has every copy on the shelf
    userName: user.name, // owner comes from the verified token, never from the request body
    userEmail: user.email,
    addedAt: new Date(),
  };

  const { insertedId } = await books().insertOne(book as BookDoc);
  res.status(201).json(serializeBook({ ...book, _id: insertedId }));
}

/** PATCH /books/:id (owner only) */
export async function updateBook(req: Request, res: Response) {
  const user = currentUser(req);
  const _id = toObjectId(req.params.id, "book id");
  const changes = parse(updateBookSchema, req.body);

  const book = await books().findOne({ _id });
  if (!book) throw new ApiError(404, "Book not found.");
  if (book.userEmail !== user.email) {
    throw new ApiError(403, "You can only edit books that you added.");
  }

  const update: Partial<BookDoc> = { ...changes };

  // Changing Total Copies keeps the borrowed copies borrowed.
  if (changes.totalCopies !== undefined) {
    const borrowed = book.totalCopies - book.availableCopies;
    if (changes.totalCopies < borrowed) {
      throw new ApiError(
        400,
        `${borrowed} ${borrowed === 1 ? "copy is" : "copies are"} currently borrowed, so Total Copies can't be lower than ${borrowed}.`
      );
    }
    update.availableCopies = changes.totalCopies - borrowed;
  }

  // The filter repeats the copy counts we just read: if someone borrowed or returned
  // a copy in the meantime, nothing matches and we ask the user to retry (no wrong counts).
  const result = await books().findOneAndUpdate(
    { _id, userEmail: user.email, totalCopies: book.totalCopies, availableCopies: book.availableCopies },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!result) {
    throw new ApiError(409, "This book was just borrowed or returned. Please try saving again.");
  }

  res.json(serializeBook(result));
}

/** DELETE /books/:id (owner only) */
export async function deleteBook(req: Request, res: Response) {
  const user = currentUser(req);
  const _id = toObjectId(req.params.id, "book id");

  const book = await books().findOne({ _id });
  if (!book) throw new ApiError(404, "Book not found.");
  if (book.userEmail !== user.email) {
    throw new ApiError(403, "You can only delete books that you added.");
  }

  const borrowed = book.totalCopies - book.availableCopies;
  if (borrowed > 0) {
    throw new ApiError(
      409,
      `You can't delete this book while ${borrowed} ${borrowed === 1 ? "copy is" : "copies are"} borrowed. Wait until ${borrowed === 1 ? "it is" : "they are"} returned.`
    );
  }

  await books().deleteOne({ _id });
  await borrows().deleteMany({ bookId: _id }); // nothing active, but clears any leftovers
  res.json({ message: "Book deleted successfully.", id: _id.toString() });
}
