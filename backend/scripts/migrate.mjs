#!/usr/bin/env node
/**
 * RELO migration runner
 *
 * Applies `migrations/*.sql` in filename order and records each one in
 * `schema_migrations`, so a deployment is repeatable instead of "remember to
 * paste this file into D1". Every statement in every migration is written to be
 * safe on a database that already has schema.sql's objects; a "duplicate
 * column" / "already exists" error is treated as already-applied.
 *
 * Usage (from backend/):
 *   npm run migrate            # remote D1
 *   npm run migrate:local      # local wrangler D1
 *   npm run migrate:dry        # list pending files, change nothing
 *
 * Options:
 *   --local | --remote   target (default: remote)
 *   --dry-run            print the plan and exit
 *   --db <name>          override the database name from wrangler.toml
 *
 * Fresh installs should keep using schema.sql (`npm run d1:migrate`). If this
 * runner sees a database that already matches the current schema, it records
 * the existing files as applied instead of re-running destructive backfills.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(backendRoot, "migrations");

const args = process.argv.slice(2);
const local = args.includes("--local");
const dryRun = args.includes("--dry-run") || args.includes("-n");
const dbArgIndex = args.indexOf("--db");
const dbOverride = dbArgIndex >= 0 ? args[dbArgIndex + 1] : null;
const mode = local ? "--local" : "--remote";

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function readDatabaseName() {
  if (dbOverride) return dbOverride;
  const tomlPath = path.join(backendRoot, "wrangler.toml");
  if (!existsSync(tomlPath)) fail("backend/wrangler.toml not found.");
  const toml = readFileSync(tomlPath, "utf8");
  const match = toml.match(/database_name\s*=\s*"([^"]+)"/);
  if (!match) fail("No database_name found in wrangler.toml. Pass --db <name>.");
  return match[1];
}

const database = readDatabaseName();

function wrangler(extraArgs) {
  // Prefer the project's own wrangler binary: it is the version the project
  // pins, and it avoids depending on a globally installed CLI.
  const bin = path.join(backendRoot, "node_modules", "wrangler", "bin", "wrangler.js");
  const result = existsSync(bin)
    ? spawnSync(process.execPath, [bin, "d1", "execute", database, mode, ...extraArgs], {
        cwd: backendRoot,
        encoding: "utf8",
        shell: false,
      })
    : spawnSync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["wrangler", "d1", "execute", database, mode, ...extraArgs],
        { cwd: backendRoot, encoding: "utf8", shell: false }
      );

  if (result.error) fail(`Could not run wrangler: ${result.error.message}`);
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function extractJsonArray(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function query(sql) {
  const result = wrangler(["--json", "--command", sql]);
  if (result.status !== 0) {
    fail(`Query failed:\n${result.stderr || result.stdout}\nSQL: ${sql}`);
  }
  const parsed = extractJsonArray(result.stdout);
  if (!parsed) {
    fail(`Wrangler returned no JSON for: ${sql}\n${result.stdout}`);
  }
  return parsed[0]?.results ?? [];
}

function record(version) {
  const safe = version.replace(/'/g, "''");
  const result = wrangler([
    "--command",
    `INSERT OR IGNORE INTO schema_migrations (version) VALUES ('${safe}')`,
  ]);
  if (result.status !== 0) {
    fail(`Could not record ${version} in schema_migrations:\n${result.stderr || result.stdout}`);
  }
}

function main() {
  const files = readdirSync(migrationsDir)
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/i.test(name))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log(`\nRELO migrations → ${database} (${local ? "local" : "remote"})`);
  if (dryRun) console.log("Mode: dry run (no changes)\n");

  if (!dryRun) {
    const ledger = wrangler([
      "--command",
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         version TEXT PRIMARY KEY,
         applied_at INTEGER NOT NULL DEFAULT (unixepoch())
       )`,
    ]);
    if (ledger.status !== 0) {
      fail(`Could not create schema_migrations:\n${ledger.stderr || ledger.stdout}`);
    }
  }

  const appliedRows = dryRun ? [] : query(`SELECT version FROM schema_migrations`);
  const applied = new Set(appliedRows.map((row) => String(row.version)));

  // schema.sql is authoritative for fresh databases. If the core tables plus
  // this batch's columns already exist and the ledger is empty, the database
  // was created from schema.sql: record the files instead of replaying the
  // backfills inside 004/005.
  if (!dryRun && applied.size === 0) {
    const tables = query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sessions','schema_migrations')`
    );
    const userColumns = query(`PRAGMA table_info(users)`);
    const looksLikeFreshSchema =
      tables.some((row) => row.name === "sessions") &&
      userColumns.some((column) => column.name === "plan_expires_at");

    if (looksLikeFreshSchema) {
      console.log(
        "Detected a database created from schema.sql — recording existing migrations as applied."
      );
      for (const file of files) record(file);
      console.log(`✓ Baseline recorded (${files.length} migration(s)).\n`);
      return;
    }
  }

  const pending = files.filter((file) => !applied.has(file));
  if (pending.length === 0) {
    console.log("✓ Already up to date.\n");
    return;
  }

  console.log(`Pending: ${pending.join(", ")}\n`);
  if (dryRun) return;

  for (const file of pending) {
    const filePath = path.join(migrationsDir, file);
    console.log(`→ ${file}`);
    const result = wrangler(["--file", filePath]);
    if (result.status !== 0) {
      const output = `${result.stdout}\n${result.stderr}`;
      const alreadyPresent = /duplicate column name|already exists|duplicate index/i.test(output);
      if (!alreadyPresent) {
        console.error(output.trim());
        fail(`Migration ${file} failed. Nothing after it was applied.`);
      }
      console.warn("  already present in this database — recording and continuing.");
    }
    record(file);
    console.log("  ✓ applied");
  }

  console.log("\n✓ Migrations complete.\n");
}

main();
