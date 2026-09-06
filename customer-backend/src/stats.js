// In-memory operational counters (same process serves API + worker).
// Non-matching webhook traffic is counted here, NOT written to Postgres —
// that is the core free-tier optimization: 1000 irrelevant events cost zero
// DB writes. Durable outcomes live in dm_logs / jobs.
export const stats = {
  startedAt: Date.now(),
  webhooksReceived: 0,
  webhooksRejected: 0,
  eventsMatched: 0,
  jobsEnqueued: 0,
  jobsCompleted: 0,
  jobsFailed: 0,
  dmSent: 0,
  lastPollAt: null,
  lastJobAt: null,
};

export function uptimeSec() {
  return Math.floor((Date.now() - stats.startedAt) / 1000);
}
