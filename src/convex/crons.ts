import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Refresh expiring tokens daily at 2 AM
crons.interval(
  "refresh expiring tokens",
  { hours: 24 },
  internal.tokenRefresh.refreshExpiringTokens,
  {}
);

export default crons;
