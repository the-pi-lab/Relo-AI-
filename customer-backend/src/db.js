// Single shared pg Pool (max 5 — free-tier friendly).
import pg from "pg";

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
    pool.on("error", (err) => {
      console.error("[db] pool error:", err.message);
    });
  }
  return pool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

export async function checkDb() {
  await getPool().query("SELECT 1");
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
