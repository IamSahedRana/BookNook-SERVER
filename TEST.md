# Zip 2: Server , test checklist

## 0. Setup
1. Node 20 or newer. In `booknook-server`: `npm install`
2. Edit `.env`: set `MONGODB_URI` (the **same database** the client uses). Keep `CLIENT_URL=http://localhost:3000`.
3. `npm run seed -- --owner-email YOUR_LOGIN_EMAIL` (use the email you registered with in the client, so you own the sample books and can edit/delete them later)
4. `npm run dev`. You should see:
   - `BookNook API running at http://localhost:5000`
   - `Verifying logins against: http://localhost:3000/api/auth/jwks`
5. Keep the **client running too** (`npm run dev` in booknook-client). The server needs it to check logins.

## 1. Public routes (browser)
- [ ] http://localhost:5000/health shows `{"status":"ok","database":"connected"}`
- [ ] http://localhost:5000/books shows 12 books, newest first (The Silent Orchard first)
- [ ] http://localhost:5000/books?sort=latest&limit=6 shows exactly 6
- [ ] http://localhost:5000/books?limit=0 shows an error message (400)
- [ ] http://localhost:5000/nothing shows `Route not found` (404)

## 2. Protected routes (VS Code, `api.http`)
Install the **REST Client** extension, open `api.http`.
1. Log in at http://localhost:3000, open **/dev/token**, click **Copy**, paste into `@token`.
2. Send `GET /books`, copy one book's `_id` into `@bookId`.

- [ ] `GET /books/:id` without the Authorization header: **401**
- [ ] `GET /books/:id` with your token: **200**
- [ ] `POST /books`: **201**. The response shows YOUR name and email as owner and `availableCopies` equal to `totalCopies`
- [ ] `POST /books` with `"category": "Cooking"`: **400** with a clear message
- [ ] `PATCH /books/:id` on your book: **200**. On a book you don't own: **403**
- [ ] `DELETE /books/:id` on a book you don't own: **403**

## 3. Borrow and return
Use a book with copies available.
- [ ] `POST /borrows`: **201**, `returnDate` is 7 days after `borrowDate`. Copy the borrow `_id` into `@borrowId`
- [ ] `GET /books/:id`: `availableCopies` went down by 1
- [ ] `POST /borrows` again for the same book: **409** "You have already borrowed this book." and copies did not change
- [ ] `GET /borrows`: lists your borrow (and only yours)
- [ ] Borrow a book with 0 copies (e.g. "Rivers of the Delta" from the seed): **409** "not available"
- [ ] `DELETE /books/:id` on your book while someone borrowed a copy: **409**
- [ ] `DELETE /borrows/:id`: **200**, and the book's copies go back up by 1
- [ ] Same `DELETE /borrows/:id` again: **404** (copies must NOT go up again)

## 4. Token problems
- [ ] Edit one character of the token: **401** "Invalid login token"
- [ ] Wait 15+ minutes (or use an old token): **401** "session has expired", then copy a new token
- [ ] Stop the **client**, then call a protected route: **503** "Could not verify your login"

## 5. Client + server together
In `booknook-client/.env.local` set `NEXT_PUBLIC_USE_MOCK_DATA=false`, restart the client. See the client's TEST.md, section F.

## Suggested commits (9)
1. `chore: server project setup with TypeScript`
2. `feat: validated env config and MongoDB connection with indexes`
3. `feat: express app with cors, json and error handlers`
4. `feat: JWT verification against BetterAuth JWKS`
5. `feat: books read routes (list with sort/limit, get one)`
6. `feat: books create, update and delete with owner checks`
7. `feat: borrow route with double-borrow guard and copy counts`
8. `feat: my borrows and return routes`
9. `chore: seed script, api.http and README`

## If something fails, send me
The step number, the response you got (status + message), and the red text in the server terminal.
