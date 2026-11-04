import { app } from "./app.js";
import { closeDb, connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  try {
    await connectDb();
  } catch (error) {
    console.error("\n❌ Could not connect to MongoDB:", (error as Error).message);
    console.error("   Check MONGODB_URI in .env (and Atlas > Network Access).\n");
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`\n✅ BookNook API running at http://localhost:${env.PORT}`);
    console.log(`   Database: ${env.DB_NAME}`);
    console.log(`   Allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);
    console.log(`   Verifying logins against: ${env.JWKS_URL}\n`);
  });

  const shutdown = () => {
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
