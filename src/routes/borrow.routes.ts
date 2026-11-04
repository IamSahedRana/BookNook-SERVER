import { Router } from "express";
import { createBorrow, listMyBorrows, returnBorrow } from "../controllers/borrow.controller.js";
import { verifyJwt } from "../middleware/verify-jwt.js";

export const borrowRoutes = Router();

borrowRoutes.use(verifyJwt); // every borrow route needs a login
borrowRoutes.post("/", createBorrow);
borrowRoutes.get("/", listMyBorrows);
borrowRoutes.delete("/:id", returnBorrow);
