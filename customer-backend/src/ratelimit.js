// Per-account hourly send budget in Postgres (Meta cap: 750 private
// replies/hour/account). Atomic check-and-increment inside one transaction —
// concurrent workers cannot overshoot the cap.
import { getPool } from "./db.js";

const WINDOW_MS = 60 * 60 * 1000;

function maxPerHour() {
  return Number(process.env.RATE_LIMIT_MAX || 750);
}

/**
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 * retryAfterMs tells the worker when the window resets (for rescheduling).
 */
export async function reserveSendSlot(accountId) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT window_start, count FROM rate_counters WHERE account_id = $1 FOR UPDATE",
      [accountId]
    );
    const now = Date.now();
    let row = rows[0];
    if (!row || now - new Date(row.window_start).getTime() >= WINDOW_MS) {
      await client.query(
        `INSERT INTO rate_counters (account_id, window_start, count)
         VALUES ($1, now(), 1)
         ON CONFLICT (account_id)
         DO UPDATE SET window_start = now(), count = 1`,
        [accountId]
      );
      await client.query("COMMIT");
      return { allowed: true, retryAfterMs: 0 };
    }
    if (row.count >= maxPerHour()) {
      const retryAfterMs =
        WINDOW_MS - (now - new Date(row.window_start).getTime());
      await client.query("ROLLBACK");
      return { allowed: false, retryAfterMs };
    }
    await client.query(
      "UPDATE rate_counters SET count = count + 1 WHERE account_id = $1",
      [accountId]
    );
    await client.query("COMMIT");
    return { allowed: true, retryAfterMs: 0 };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
