// Boot: validate env → connect DB → migrate → bootstrap account →
// serve API + run embedded worker. One container, one Postgres.
import { loadConfig } from "./config.js";
import { query, closeDb } from "./db.js";
import { runMigrations } from "./migrate.js";
import { createApp } from "./server.js";
import { startWorker } from "./worker.js";
import { protectSecret } from "./crypto.js";

async function bootstrapAccount(config) {
  const { instagramId, username, accessToken } = config.bootstrapAccount;
  if (!instagramId || !accessToken) {
    console.log("[boot] no IG account in env — connect via POST /api/config/push");
    return;
  }
  await query(
    `INSERT INTO ig_accounts (instagram_id, username, access_token, is_active, updated_at)
     VALUES ($1, $2, $3, TRUE, now())
     ON CONFLICT (instagram_id) DO NOTHING`,
    [instagramId, username || instagramId, protectSecret(accessToken)]
  );
  console.log(`[boot] bootstrapped IG account ${username || instagramId}`);
}

async function main() {
  const config = loadConfig();
  console.log(`[boot] chatflow-customer-backend v${config.version}`);

  await runMigrations();
  await bootstrapAccount(config);

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.log(`[boot] listening on :${config.port}`);
  });
  const stopWorker = startWorker({ pollIntervalMs: config.worker.pollIntervalMs });

  const shutdown = async (signal) => {
    console.log(`[boot] ${signal} — shutting down`);
    stopWorker();
    await new Promise((resolve) => server.close(resolve));
    await closeDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[boot] fatal:", err.message);
  process.exit(1);
});
