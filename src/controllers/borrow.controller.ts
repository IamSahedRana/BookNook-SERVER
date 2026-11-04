import type { Request, Response } from "express";
import { MongoServerError, ObjectId } from "mongodb";
import { books, borrows } from "../config/db.js";
import { createBorrowSchema } from "../schemas/borrow.schema.js";
import { serializeBorrow } from "../serializers.js";
import type { BorrowDoc } from "../types/borrow.js";
import { ApiError } from "../utils/api-error.js";
import { parse, toObjectId } from "../utils/validate.js";

const LOAN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function currentUser(req: Request) {
  if (!req.user) throw new ApiError(401, "Please log in to continue.");
  return req.user;
}

const isDuplicateKey = (error: unknown) =>
  error instanceof MongoServerError && error.code === 11000;

/** POST /borrows  { bookId } (login required) */
export async function createBorrow(req: Request, res: Response) {
  const user = currentUser(req);
  const { bookId: rawBookId } = parse(createBorrowSchema, req.body);
  const bookId = toObjectId(rawBookId, "book id");

  const book = await books().findOne({ _id: bookId });
  if (!book) throw new ApiError(404, "Book not found.");

  // 1) No double borrow (friendly check; the unique index below is the real guard)
  if (await borrows().findOne({ bookId, userEmail: user.email })) {
    throw new ApiError(409, "You have already borrowed this book.");
  }

  if (book.availableCopies <= 0) {
    throw new ApiError(409, "Sorry, this book is not available right now.");
  }

  const now = new Date();
  const borrow: BorrowDoc = {
    _id: new ObjectId(),
    bookId,
    bookTitle: book.title,
    bookImage: book.image,
    userEmail: user.email,
    userName: user.name,
    borrowDate: now,
    returnDate: new Date(now.getTime() + LOAN_DAYS * DAY_MS),
  };

  // 2) Save the borrow. If two requests race, the unique index lets only one through.
  try {
    await borrows().insertOne(borrow);
  } catch (error) {
    if (isDuplicateKey(error)) throw new ApiError(409, "You have already borrowed this book.");
    throw error;
  }

  // 3) Take one copy off the shelf. The filter (availableCopies > 0) means two readers
  //    can never take the last copy at the same time.
  const taken = await books().updateOne(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } }
  );
  if (taken.modifiedCount === 0) {
    await borrows().deleteOne({ _id: borrow._id }); // undo step 2
    throw new ApiError(409, "Sorry, this book is not available right now.");
  }

  res.status(201).json(serializeBorrow(borrow));
}

/** GET /borrows (login required): only the logged-in reader's borrows */
export async function listMyBorrows(req: Request, res: Response) {
  const user = currentUser(req);
  const list = await borrows().find({ userEmail: user.email }).sort({ borrowDate: -1 }).toArray();
  res.json(list.map(serializeBorrow));
}

/** DELETE /borrows/:id (login required): return the book */
export async function returnBorrow(req: Request, res: Response) {
  const user = currentUser(req);
  const _id = toObjectId(req.params.id, "borrow id");

  const borrow = await borrows().findOne({ _id });
  if (!borrow) throw new ApiError(404, "Borrow record not found. Maybe it was already returned.");
  if (borrow.userEmail !== user.email) {
    throw new ApiError(403, "You can only return books that you borrowed.");
  }

  // deleteOne tells us if WE removed it. If two requests race (double click), only one
  // gets deletedCount 1: that one adds the copy back, the other is told it is already returned.
  const { deletedCount } = await borrows().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new ApiError(404, "Borrow record not found. Maybe it was already returned.");
  }
  await books().updateOne({ _id: borrow.bookId }, { $inc: { availableCopies: 1 } });

  res.json({ message: "Book returned successfully.", id: _id.toString() });
}
