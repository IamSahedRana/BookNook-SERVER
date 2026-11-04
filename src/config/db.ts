import { MongoClient, type Collection, type Db } from "mongodb";
import { env } from "./env.js";
import type { BookDoc } from "../types/book.js";
import type { BorrowDoc } from "../types/borrow.js";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectDb() {
  client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(env.DB_NAME);
  await ensureIndexes();
  return db;
}

export async function closeDb() {
  await client?.close();
}

export async function pingDb() {
  if (!client) throw new Error("Database is not connected");
  await client.db("admin").command({ ping: 1 });
}

function database(): Db {
  if (!db) throw new Error("Database is not connected yet");
  return db;
}

export const books = (): Collection<BookDoc> => database().collection<BookDoc>("books");
export const borrows = (): Collection<BorrowDoc> => database().collection<BorrowDoc>("borrows");

async function ensureIndexes() {
  await Promise.all([
    // One borrow per reader per book: this is what blocks a double borrow, even if two requests race.
    borrows().createIndex(
      { bookId: 1, userEmail: 1 },
      { unique: true, name: "one_borrow_per_reader_per_book" }
    ),
    borrows().createIndex({ userEmail: 1, borrowDate: -1 }),
    books().createIndex({ addedAt: -1 }),
    books().createIndex({ userEmail: 1 }),
  ]);
}
