import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

// BetterAuth publishes its public keys here. jose downloads and caches them,
// and checks the token signature, expiry, issuer and audience.
const jwks = createRemoteJWKSet(new URL(env.JWKS_URL));

/** Protects a route: needs "Authorization: Bearer <BetterAuth JWT>". Sets req.user. */
export async function verifyJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Please log in to continue.");
  }
  const token = header.slice("Bearer ".length).trim();

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

  
 
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof errors.JWTExpired) {
      throw new ApiError(401, "Your session has expired. Please log in again.");
    }
    console.error("[auth] could not verify token:", error);
      throw new ApiError(503, "Could not verify your login right now. Please try again in a moment.");
    }
}
