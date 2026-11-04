import type { ObjectId } from "mongodb";

export const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface BookDoc {
  _id: ObjectId;
  title: string;
  author: string;
  category: Category;
  image: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  userName: string;
  userEmail: string;
  addedAt: Date;
  /** true for books created by `npm run seed` */
  isSeed?: boolean;
}
