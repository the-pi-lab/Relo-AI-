// Shared helpers for Postgres-backed tests.
// Tests are skipped (not failed) when TEST_DATABASE_URL is unset, so
// `npm test` stays green on machines without a database.
import { query } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";

export function pgUrl() {
  return process.env.TEST_DATABASE_URL || null;
}

let migrated = false;

export async function ensureDb() {
  process.env.DATABASE_URL = pgUrl();
  if (!migrated) {
    await runMigrations();
    migrated = true;
  }
  await query(
    `TRUNCATE dm_logs, jobs, processed_events, rate_counters, contacts,
              ig_accounts, flows RESTART IDENTITY CASCADE`
  );
}
