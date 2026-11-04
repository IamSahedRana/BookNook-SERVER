# Zip 6 note: render.yaml added and README gets a Deploy section. Code unchanged.

# Zip 2: Server (booknook-server)

New project: Express 5 + TypeScript + MongoDB. Nothing to merge with an older version.

## Files
| File | What it does |
|---|---|
| `package.json`, `tsconfig.json`, `.gitignore` | Project setup (ES modules, strict TypeScript) |
| `.env.example`, `.env` | Settings. Fill in `MONGODB_URI` in `.env` |
| `api.http` | Try every route from VS Code (REST Client extension) |
| `src/server.ts`, `src/app.ts` | Start-up and the Express app |
| `src/config/env.ts` | Validates `.env` and prints a clear message if something is missing |
| `src/config/db.ts` | MongoDB connection, collections, indexes (incl. the unique double-borrow index) |
| `src/middleware/verify-jwt.ts` | Checks the BetterAuth JWT against the client's JWKS (`jose`) |
| `src/middleware/error-handler.ts`, `not-found.ts` | JSON errors: `{ "message": "..." }` |
| `src/routes/*`, `src/controllers/*` | The 8 routes from the brief |
| `src/schemas/*` | Input validation (zod) |
| `src/serializers.ts` | Response shapes that match the client's `Book` / `Borrow` types |
| `src/scripts/seed.ts` | 12 sample books + sample borrows, `--owner-email` option |

## Decisions
- **Routes at the root** (`/books`, `/borrows`), exactly as in the brief.
- **`GET /books/:id` needs a login**: the Book Details page is private. `GET /books` stays public.
- **The owner is never taken from the request body**, always from the verified token.
- **Delete is blocked while copies are borrowed** (409), so no borrow record is left pointing at a missing book.
- **No database transactions** (they need a replica set and break local MongoDB). The same safety comes from the unique index plus guarded `$inc` updates.
- **Express 5** forwards errors from async handlers by itself, so no `asyncHandler` file is needed.

## Verified before sending
Tested against **real MongoDB 7.0** (standalone, the same kind you run locally) with the real client issuing real BetterAuth tokens:
- 76 automated checks passed: all 8 routes, 401/403/404/409/400 cases, forged and garbage tokens, CORS.
- Races: three readers racing for the last copy (exactly one wins); one reader double-clicking 5 times (one borrow, one copy taken); 5 simultaneous returns (one succeeds, copy added back once).
- Production build (`npm run build` then `node dist/server.js`) runs.
- A found-and-fixed bug: simultaneous returns used to answer "success" twice. Now one gets 200 and the rest 404.

## Not verified
- MongoDB Atlas itself (same driver and features, but I tested a local MongoDB).
- Deployment (Zip 6).
