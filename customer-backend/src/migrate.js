// Minimal ordered SQL migration runner (no extra deps).
// Tracks applied versions in schema_migrations; each file runs once.
// A session-level advisory lock serializes concurrent migrators (test
// runners, rolled deploys) — without it, parallel CREATE TABLE IF NOT
// EXISTS statements race on pg_type (duplicate-key 23505).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(here, "..", "migrations");

export async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('chatflow-migrate'))");
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         version TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    const applied = new Set(
      (await client.query("SELECT version FROM schema_migrations")).rows.map(
        (r) => r.version
      )
    );
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (applied.has(version)) continue;
      console.log(`[migrate] applying ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING",
          [version]
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    console.log("[migrate] up to date");
  } finally {
    client.release(); // also releases the advisory lock
  }
}
