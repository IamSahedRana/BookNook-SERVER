# BookNook Server

REST API for BookNook (a small online library: add a book, borrow a book, return a book).
Express + TypeScript + MongoDB. Logins are checked with the JWT that BetterAuth issues in the Next.js client.

## Run it

```bash
npm install
cp .env.example .env      # then fill in MONGODB_URI
npm run seed              # 12 sample books (optional)
npm run dev               # http://localhost:5000
```

Use the **same MongoDB database** as the client. The server uses the collections `books` and `borrows`; BetterAuth keeps its own (`user`, `session`, ...).

| Script | What it does |
|---|---|
| `npm run dev` | Start with auto-restart |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run seed` | Replace the sample books. Add `-- --owner-email you@example.com` to own them |
| `npm run typecheck` | Check the TypeScript |

## The 8 routes

| Method | Route | Login | What it does |
|---|---|---|---|
| GET | `/books` | no | All books, newest first. `?sort=latest&limit=6`, `?email=` |
| GET | `/books/:id` | yes | One book |
| POST | `/books` | yes | Add a book (owner comes from the token) |
| PATCH | `/books/:id` | owner | Update a book |
| DELETE | `/books/:id` | owner | Delete a book (blocked while copies are borrowed) |
| POST | `/borrows` | yes | Borrow a book `{ "bookId": "..." }` for 7 days |
| GET | `/borrows` | yes | The logged-in reader's borrows |
| DELETE | `/borrows/:id` | yes | Return a book |

Extra: `GET /health` checks the database.

## How login checking works

1. The client asks BetterAuth for a JWT (`authClient.token()`).
2. It sends `Authorization: Bearer <token>`.
3. `src/middleware/verify-jwt.ts` downloads BetterAuth's public keys from `<CLIENT_URL>/api/auth/jwks` and checks the signature, expiry, issuer and audience. No shared secret is needed.

So the **client must be running** (or deployed) for protected routes to work, and `CLIENT_URL` must match the client's address exactly.

## Copies and borrowing

- A unique index on `borrows (bookId, userEmail)` makes a double borrow impossible, even with two clicks at once.
- Borrow takes a copy with `$inc: { availableCopies: -1 }` guarded by `availableCopies > 0`, so copies never go below 0.
- Return deletes the borrow first and only then `$inc +1`, so a double click never adds two copies.
- Editing Total Copies keeps borrowed copies borrowed (it can't go below what is out).

## Deploy on Render

`render.yaml` is included. In Render choose **New > Blueprint**, connect this repo, then set `MONGODB_URI` and `CLIENT_URL` (your Vercel address). Health check: `/health`.
Build: `npm install --include=dev && npm run build`, start: `npm start`. Full steps are in the client's `DEPLOY.md`.

## Live links

- API: https://YOUR-BOOKNOOK-API.onrender.com
- Client: https://YOUR-BOOKNOOK-SITE.vercel.app

## Folder map

```
src/
  server.ts            start (connect DB, listen)
  app.ts               express app: cors, json, routes, errors
  config/              env.ts (validated .env), db.ts (collections + indexes)
  middleware/          verify-jwt.ts, not-found.ts, error-handler.ts
  routes/              book.routes.ts, borrow.routes.ts
  controllers/         book.controller.ts, borrow.controller.ts
  schemas/             zod validation
  types/               BookDoc, BorrowDoc, AuthUser
  scripts/seed.ts      sample data
```
