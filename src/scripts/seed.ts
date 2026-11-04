/**
 * npm run seed
 * npm run seed -- --owner-email you@example.com --owner-name "Your Name"
 *
 * Adds 12 sample books (and a few borrows by pretend readers so the copy counts add up).
 * Running it again replaces only the seeded data, never books added by real users.
 * With --owner-email the books belong to your account, so you can test Edit/Delete.
 */
import { ObjectId } from "mongodb";
import { books, borrows, closeDb, connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import type { BookDoc, Category } from "../types/book.js";
import type { BorrowDoc } from "../types/borrow.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

type SeedBook = {
  title: string;
  author: string;
  category: Category;
  description: string;
  totalCopies: number;
  /** how many copies pretend readers have borrowed */
  borrowed: number;
  owner: { name: string; email: string };
};

const SEED_BOOKS: SeedBook[] = [
  { title: "The Silent Orchard", author: "Maya Rahman", category: "Fiction", totalCopies: 5, borrowed: 2, owner: { name: "Maya Rahman", email: "maya@example.com" },
    description: "A widow inherits an abandoned orchard and slowly learns why the village never speaks of the family who planted it. A quiet, atmospheric mystery about memory and belonging." },
  { title: "Quantum Gardens", author: "Imran Hossain", category: "Science", totalCopies: 4, borrowed: 0, owner: { name: "Imran Hossain", email: "imran@example.com" },
    description: "A friendly tour of quantum physics told through the plants, light and soil of an ordinary garden. No equations required, only curiosity." },
  { title: "Rivers of the Delta", author: "Nusrat Jahan", category: "History", totalCopies: 3, borrowed: 3, owner: { name: "Nusrat Jahan", email: "nusrat@example.com" },
    description: "How the rivers of the Bengal delta shaped trade, migration and everyday life across five centuries, told through letters, maps and boatmen's stories." },
  { title: "The Little Lantern", author: "Farhan Ali", category: "Kids", totalCopies: 6, borrowed: 1, owner: { name: "Farhan Ali", email: "farhan@example.com" },
    description: "A small lantern is afraid of the dark until a stray kitten shows it what light is really for. A gentle bedtime story with bright pictures." },
  { title: "Notes from a Rainy City", author: "Tania Akter", category: "Others", totalCopies: 2, borrowed: 1, owner: { name: "Tania Akter", email: "tania@example.com" },
    description: "Short essays, recipes and sketches collected over one long monsoon season in Dhaka. Best read slowly, with tea." },
  { title: "The Cartographer's Daughter", author: "Rafiq Chowdhury", category: "Fiction", totalCopies: 3, borrowed: 1, owner: { name: "Rafiq Chowdhury", email: "rafiq@example.com" },
    description: "When a mapmaker disappears, his daughter follows the unfinished maps across three countries and discovers the places on them are not what they seem." },
  { title: "A Brief Guide to the Stars", author: "Dr. Anika Sultana", category: "Science", totalCopies: 5, borrowed: 0, owner: { name: "Anika Sultana", email: "anika@example.com" },
    description: "Everything a beginner needs to find constellations, understand how stars are born and die, and enjoy the night sky with nothing but your eyes." },
  { title: "Empires of Salt", author: "Kamal Uddin", category: "History", totalCopies: 2, borrowed: 1, owner: { name: "Kamal Uddin", email: "kamal@example.com" },
    description: "The surprising story of salt: how a humble mineral built trade routes, funded empires and sparked revolts from the coast to the mountains." },
  { title: "Moon Cake Mondays", author: "Sadia Islam", category: "Kids", totalCopies: 4, borrowed: 0, owner: { name: "Sadia Islam", email: "sadia@example.com" },
    description: "Every Monday, Mina and her grandmother bake something new and share it with the neighbours. A warm picture book about family and food." },
  { title: "Midnight at the Reading Room", author: "Maya Rahman", category: "Fiction", totalCopies: 3, borrowed: 0, owner: { name: "Maya Rahman", email: "maya@example.com" },
    description: "Locked inside an old university library overnight, a student finds a book that keeps rewriting itself. A cozy thriller for book lovers." },
  { title: "The Honest Machine", author: "Imran Hossain", category: "Science", totalCopies: 2, borrowed: 0, owner: { name: "Imran Hossain", email: "imran@example.com" },
    description: "What would it take to build a computer that tells the truth? An accessible look at how machines learn, and where they go wrong." },
  { title: "Letters from the Old Port", author: "Nusrat Jahan", category: "History", totalCopies: 3, borrowed: 1, owner: { name: "Nusrat Jahan", email: "nusrat@example.com" },
    description: "A collection of real letters written by sailors, merchants and families at a busy harbour a hundred years ago, with notes on daily life." },
];

async function main() {
  await connectDb();

  const ownerEmail = arg("owner-email")?.trim().toLowerCase();
  const ownerName = arg("owner-name")?.trim() || ownerEmail?.split("@")[0];
  const imageBase = (arg("image-base") ?? env.CLIENT_URL).replace(/\/$/, "");

  // Remove the previous seed (books + their borrows), nothing else
  const oldIds = (await books().find({ isSeed: true }, { projection: { _id: 1 } }).toArray()).map((b) => b._id);
  if (oldIds.length > 0) await borrows().deleteMany({ bookId: { $in: oldIds } });
  await books().deleteMany({ isSeed: true });

  const now = Date.now();
  const bookDocs: BookDoc[] = [];
  const borrowDocs: BorrowDoc[] = [];

  SEED_BOOKS.forEach((seed, index) => {
    const _id = new ObjectId();
    const owner = ownerEmail ? { name: ownerName ?? ownerEmail, email: ownerEmail } : seed.owner;
    const image = `${imageBase}/images/mock/cover-${String(index + 1).padStart(2, "0")}.svg`;

    bookDocs.push({
      _id,
      title: seed.title,
      author: seed.author,
      category: seed.category,
      image,
      description: seed.description,
      totalCopies: seed.totalCopies,
      availableCopies: seed.totalCopies - seed.borrowed,
      userName: owner.name,
      userEmail: owner.email,
      addedAt: new Date(now - index * 2 * DAY_MS), // index 0 = newest
      isSeed: true,
    });

    for (let reader = 1; reader <= seed.borrowed; reader++) {
      const borrowDate = new Date(now - reader * DAY_MS);
      borrowDocs.push({
        _id: new ObjectId(),
        bookId: _id,
        bookTitle: seed.title,
        bookImage: image,
        userEmail: `seed-reader-${reader}@example.com`,
        userName: `Sample Reader ${reader}`,
        borrowDate,
        returnDate: new Date(borrowDate.getTime() + 7 * DAY_MS),
        isSeed: true,
      });
    }
  });

  await books().insertMany(bookDocs);
  if (borrowDocs.length > 0) await borrows().insertMany(borrowDocs);

  console.log(`\n✅ Seeded ${bookDocs.length} books and ${borrowDocs.length} sample borrows into "${env.DB_NAME}".`);
  console.log(`   Book owner: ${ownerEmail ?? "pretend authors (use --owner-email to own them yourself)"}`);
  console.log(`   Cover images: ${imageBase}/images/mock/cover-NN.svg (served by the Next.js client)\n`);
}

main()
  .catch((error) => {
    console.error("\n❌ Seed failed:", error.message ?? error);
    process.exitCode = 1;
  })
  .finally(closeDb);
