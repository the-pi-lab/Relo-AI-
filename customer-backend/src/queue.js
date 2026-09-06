// Postgres-backed durable queue (no Redis).
// - Enqueue is idempotent via UNIQUE(job_key): deterministic keys mean the
//   same comment+automation can never create two jobs, even across webhook
//   redeliveries or worker restarts.
// - Claiming uses FOR UPDATE SKIP LOCKED: safe with concurrent workers, no
//   two workers ever process the same job.
// - Delays are durable (next_run_at), never setTimeout.
import { query, getPool } from "./db.js";

const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 60 * 60_000];

export function backoffMs(attempts) {
  return BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
}

/** Returns true when a NEW job was created, false when it already existed. */
export async function enqueueJob(jobKey, type, payload, maxAttempts = 5) {
  const { rowCount } = await query(
    `INSERT INTO jobs (job_key, type, payload, max_attempts)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (job_key) DO NOTHING`,
    [jobKey, type, payload, maxAttempts]
  );
  return rowCount === 1;
}

/** Atomically claim up to `limit` due jobs. */
export async function claimJobs(limit = 10) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM jobs
       WHERE status IN ('pending', 'failed')
         AND attempts < max_attempts
         AND next_run_at <= now()
       ORDER BY next_run_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit]
    );
    for (const job of rows) {
      await client.query(
        `UPDATE jobs SET status = 'processing', attempts = attempts + 1,
                         updated_at = now() WHERE id = $1`,
        [job.id]
      );
      job.attempts += 1;
      job.status = "processing";
    }
    await client.query("COMMIT");
    return rows;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function completeJob(id) {
  await query(
    "UPDATE jobs SET status = 'completed', updated_at = now() WHERE id = $1",
    [id]
  );
}

/** Requeue with exponential backoff, or terminal-fail past max attempts. */
export async function failJob(id, attempts, maxAttempts, errorMessage) {
  if (attempts >= maxAttempts) {
    await query(
      `UPDATE jobs SET status = 'failed', last_error = $2, updated_at = now()
       WHERE id = $1`,
      [id, errorMessage]
    );
    return "dead";
  }
  await query(
    `UPDATE jobs SET status = 'pending', last_error = $2,
                     next_run_at = now() + ($3 || ' milliseconds')::interval,
                     updated_at = now() WHERE id = $1`,
    [id, errorMessage, String(backoffMs(attempts))]
  );
  return "retry";
}

/** Reschedule for an explicit delay (e.g. rate-limit window reset). */
export async function rescheduleJob(id, delayMs, errorMessage) {
  await query(
    `UPDATE jobs SET status = 'pending', last_error = $2,
                     next_run_at = now() + ($3 || ' milliseconds')::interval,
                     updated_at = now() WHERE id = $1`,
    [id, errorMessage, String(delayMs)]
  );
}

/** Retention: drop old terminal jobs (bounded table, free-tier friendly). */
export async function cleanupJobs() {
  await query(
    `DELETE FROM jobs
     WHERE status = 'completed' AND updated_at < now() - INTERVAL '7 days'`
  );
  await query(
    `DELETE FROM jobs
     WHERE status = 'failed' AND updated_at < now() - INTERVAL '30 days'`
  );
  await query(
    "DELETE FROM processed_events WHERE seen_at < now() - INTERVAL '30 days'"
  );
}
