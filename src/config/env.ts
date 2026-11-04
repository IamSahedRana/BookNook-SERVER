import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is empty. Add your MongoDB connection string to .env"),
  DB_NAME: z.string().min(1).default("booknook"),
  /** The Next.js client. Used for CORS and as the default JWT issuer/audience. */
  CLIENT_URL: z.url().default("http://localhost:3000"),
  /** Extra allowed origins, comma separated (e.g. a Vercel preview URL). */
  EXTRA_ORIGINS: z.string().default(""),
  /** Where BetterAuth publishes its public keys. Default: <CLIENT_URL>/api/auth/jwks */
  JWKS_URL: z.url().optional(),
  /** BetterAuth uses its base URL as issuer and audience. Default: CLIENT_URL */
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Invalid environment variables in .env:\n");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".") || "env"}: ${issue.message}`);
  }
  console.error("\nCopy .env.example to .env and fill it in.\n");
  process.exit(1);
}

const raw = parsed.data;
const clientOrigin = new URL(raw.CLIENT_URL).origin;

export const env = {
  ...raw,
  CLIENT_URL: clientOrigin,
  JWKS_URL: raw.JWKS_URL ?? `${clientOrigin}/api/auth/jwks`,
  JWT_ISSUER: raw.JWT_ISSUER ?? clientOrigin,
  JWT_AUDIENCE: raw.JWT_AUDIENCE ?? clientOrigin,
  ALLOWED_ORIGINS: [
    clientOrigin,
    ...raw.EXTRA_ORIGINS.split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean),
  ],
  isProduction: raw.NODE_ENV === "production",
};
