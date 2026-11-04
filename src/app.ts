import cors from "cors";
import express from "express";
import { pingDb } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { routes } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({ name: "BookNook API", status: "running" });
});

app.get("/health", async (_req, res) => {
  try {
    await pingDb();
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.use(routes);
app.use(notFound);
app.use(errorHandler);
