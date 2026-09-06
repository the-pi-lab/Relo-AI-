import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { pgUrl, ensureDb } from "./helpers.js";
import { query } from "../src/db.js";
import {
  enqueueJob,
  claimJobs,
  completeJob,
  failJob,
  rescheduleJob,
  cleanupJobs,
  backoffMs,
} from "../src/queue.js";

describe("backoffMs (no DB)", () => {
  it("backs off exponentially and caps", () => {
    assert.equal(backoffMs(1), 60_000);
    assert.equal(backoffMs(2), 5 * 60_000);
    assert.equal(backoffMs(3), 30 * 60_000);
    assert.equal(backoffMs(99), 60 * 60_000);
  });
});

if (!pgUrl()) {
  it("pg-backed queue tests (skipped: TEST_DATABASE_URL not set)", () => {});
} else {
  describe("queue (Postgres)", () => {
    before(async () => {
      await ensureDb();
    });

    it("enqueue is idempotent on job_key", async () => {
      await ensureDb();
      assert.equal(await enqueueJob("qk1", "comment", { a: 1 }), true);
      assert.equal(await enqueueJob("qk1", "comment", { a: 1 }), false);
      const { rows } = await query("SELECT COUNT(*)::int AS n FROM jobs");
      assert.equal(rows[0].n, 1);
    });

    it("claim returns only due jobs and locks them", async () => {
      await ensureDb();
      await enqueueJob("qk-due1", "comment", {});
      await enqueueJob("qk-due2", "comment", {});
      await enqueueJob("qk-future", "comment", {});
      await query("UPDATE jobs SET next_run_at = now() + INTERVAL '1 hour' WHERE job_key = 'qk-future'");
      const claimed = await claimJobs(10);
      assert.equal(claimed.length, 2);
      assert.ok(claimed.every((j) => j.status === "processing" && j.attempts === 1));
      const { rows } = await query("SELECT status FROM jobs WHERE job_key = 'qk-future'");
      assert.equal(rows[0].status, "pending");
    });

    it("failJob retries with backoff, then dead-letters", async () => {
      await ensureDb();
      await enqueueJob("qk-fail", "comment", {}, 3);
      const [job] = await claimJobs(10);
      const outcome = await failJob(job.id, job.attempts, job.max_attempts, "boom");
      assert.equal(outcome, "retry");
      const { rows } = await query("SELECT status, next_run_at, last_error FROM jobs WHERE id = $1", [job.id]);
      assert.equal(rows[0].status, "pending");
      assert.ok(new Date(rows[0].next_run_at).getTime() > Date.now() + 30_000);
      assert.equal(rows[0].last_error, "boom");

      const outcome2 = await failJob(job.id, 3, 3, "boom-final");
      assert.equal(outcome2, "dead");
      const { rows: rows2 } = await query("SELECT status FROM jobs WHERE id = $1", [job.id]);
      assert.equal(rows2[0].status, "failed");
    });

    it("rescheduleJob sets an explicit delay", async () => {
      await ensureDb();
      await enqueueJob("qk-resched", "comment", {});
      const [job] = await claimJobs(10);
      await rescheduleJob(job.id, 600_000, "rate limited");
      const { rows } = await query("SELECT status, next_run_at FROM jobs WHERE id = $1", [job.id]);
      assert.equal(rows[0].status, "pending");
      const delay = new Date(rows[0].next_run_at).getTime() - Date.now();
      assert.ok(delay > 590_000 && delay <= 600_000);
    });

    it("cleanupJobs retains recent, drops old terminal rows", async () => {
      await ensureDb();
      await enqueueJob("qk-old-done", "comment", {});
      const [job] = await claimJobs(10);
      await completeJob(job.id);
      await query("UPDATE jobs SET updated_at = now() - INTERVAL '8 days' WHERE id = $1", [job.id]);
      await enqueueJob("qk-new-done", "comment", {});
      const [job2] = await claimJobs(10);
      await completeJob(job2.id);
      await cleanupJobs();
      const { rows } = await query("SELECT job_key FROM jobs ORDER BY job_key");
      assert.deepEqual(rows.map((r) => r.job_key), ["qk-new-done"]);
    });
  });
}
