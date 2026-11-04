import type { ObjectId } from "mongodb";

export interface BorrowDoc {
  _id: ObjectId;
  bookId: ObjectId;
  bookTitle: string;
  bookImage: string;
  userEmail: string;
  userName: string;
  borrowDate: Date;
  returnDate: Date;
  isSeed?: boolean;
}
