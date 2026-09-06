// Embedded worker: polls the Postgres queue and runs the engine.
// Same process as the API (one container, free-tier friendly). No setTimeout
// chains for durable delays — all scheduling lives in jobs.next_run_at.
import { claimJobs, completeJob, failJob, rescheduleJob, cleanupJobs } from "./queue.js";
import { processJob, RescheduleError } from "./engine.js";
import { refreshFlowCache } from "./flows.js";
import { stats } from "./stats.js";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// Bounded concurrency for a claimed batch: jobs are independent (distinct
// comments/users), and each holds a pool client only briefly per query.
// Kept small (3 of 5 pool clients) so bursts drain faster without starving
// the API path on free-tier Postgres.
const BATCH_CONCURRENCY = 3;

async function runJob(job) {
  stats.lastJobAt = new Date().toISOString();
  try {
    await processJob(job);
    await completeJob(job.id);
    stats.jobsCompleted += 1;
  } catch (err) {
    if (err instanceof RescheduleError) {
      await rescheduleJob(job.id, err.delayMs, err.message);
      console.log(`[worker] job ${job.job_key} rescheduled: ${err.message}`);
    } else {
      const outcome = await failJob(
        job.id, job.attempts, job.max_attempts,
        String(err?.message || err).slice(0, 500)
      );
      stats.jobsFailed += 1;
      console.warn(
        `[worker] job ${job.job_key} ${outcome} (attempt ${job.attempts}):`,
        err?.message || err
      );
    }
  }
}

async function runBatch(jobs, isRunning) {
  let next = 0;
  const runners = Array.from(
    { length: Math.min(BATCH_CONCURRENCY, jobs.length) },
    async () => {
      while (isRunning() && next < jobs.length) {
        const job = jobs[next];
        next += 1;
        await runJob(job);
      }
    }
  );
  await Promise.all(runners);
}

export function startWorker({ pollIntervalMs }) {
  let running = true;
  let lastCleanup = Date.now();
  console.log(`[worker] started (poll ${pollIntervalMs}ms)`);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function tick() {
    while (running) {
      try {
        stats.lastPollAt = new Date().toISOString();
        const jobs = await claimJobs(10);
        if (jobs.length === 0) {
          await sleep(pollIntervalMs);
          continue;
        }
        await runBatch(jobs, () => running);
        if (Date.now() - lastCleanup > CLEANUP_INTERVAL_MS) {
          lastCleanup = Date.now();
          try {
            await cleanupJobs();
            await refreshFlowCache();
          } catch (err) {
            console.warn("[worker] cleanup failed:", err.message);
          }
        }
      } catch (err) {
        console.error("[worker] poll error:", err.message);
        await sleep(pollIntervalMs);
      }
    }
  }

  void tick();
  return () => {
    running = false;
  };
}
