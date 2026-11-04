import { MongoClient, type Collection, type Db } from "mongodb";
import { env } from "./env.js";
import type { BookDoc } from "../types/book.js";
import type { BorrowDoc } from "../types/borrow.js";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectDb() {
  client = new MongoClient(env.MONGO_URI, { serverApi: { version: "1" } });   
  await client.connect();
  db = client.db(env.MONGO_DB_NAME);
  await ensureIndexes();
} 



export async function pingDb() {
  if (!client) throw new Error("Database is not connected");
  await client.db("admin").command({ ping: 1 });
}

function database(): Db {
  if (!db) throw new Error("Database is not connected");
  return db ;
}

export const books = (): Collection<BookDoc> => database().collection<BookDoc>("books");
export const borrows = (): Collection<BorrowDoc> => database().collection<BorrowDoc>("borrows");

async function ensureIndexes() {
 await Promise.all([  
    borrows().createIndex({ userEmail: 1, borrowDate: -1 }),
    books().createIndex({ addedAt: -1 }),
    books().createIndex({ userEmail: 1 }),
  ]);
}
