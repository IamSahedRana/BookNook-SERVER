import { Router } from "express";
import { bookRoutes } from "./book.routes.js";
import { borrowRoutes } from "./borrow.routes.js";

export const routes = Router();

routes.use("/books", bookRoutes);
routes.use("/borrows", borrowRoutes);
