import type { AuthUser } from "./auth.js";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by verifyJwt on protected routes */
    user?: AuthUser;
  }
}

export {};
