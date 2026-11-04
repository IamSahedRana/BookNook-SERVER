import type { BookDoc } from "./types/book.js";
import type { BorrowDoc } from "./types/borrow.js";

/** Shapes returned to the client (matches client/src/types). */
export function serializeBook(book: BookDoc) {
  return {
    _id: book._id.toString(),
    title: book.title,
    author: book.author,
    category: book.category,
    image: book.image,
    description: book.description,
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    userName: book.userName,
    userEmail: book.userEmail,
    addedAt: book.addedAt.toISOString(),
  };
}

export function serializeBorrow(borrow: BorrowDoc) {
  return {
    _id: borrow._id.toString(),
    bookId: borrow.bookId.toString(),
    bookTitle: borrow.bookTitle,
    bookImage: borrow.bookImage,
    userEmail: borrow.userEmail,
    borrowDate: borrow.borrowDate.toISOString(),
    returnDate: borrow.returnDate.toISOString(),
  };
}
