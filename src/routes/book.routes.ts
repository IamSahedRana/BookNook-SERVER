import { Router } from "express";
import { createBook, deleteBook, getBook, listBooks, updateBook } from "../controllers/book.controller.js";
import { verifyJwt } from "../middleware/verify-jwt.js";

export const bookRoutes = Router();

bookRoutes.get("/", listBooks); // public
bookRoutes.get("/:id", verifyJwt, getBook);
bookRoutes.post("/", verifyJwt, createBook);
bookRoutes.patch("/:id", verifyJwt, updateBook);
bookRoutes.delete("/:id", verifyJwt, deleteBook);
