import type { D1Database } from "@cloudflare/workers-types";

/**
 * Durable, D1-backed fixed-window rate limiter.
 *
 * The previous limiter was a per-isolate Map: Cloudflare runs many isolates
 * behind one hostname, so an attacker effectively got `limit × isolates`
 * requests and a cold start reset the window. This one keeps the counter in
 * D1 so the limit is global, and falls back to the in-memory window only if
 * the `rate_limits` table is missing (a pre-migration deployment), so a
 * missing table degrades the limit instead of taking auth down.
 */

export interface RateLimitOptions {
  /** Requests permitted per window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window rolls over; safe for a `Retry-After` header. */
  retryAfterSeconds: number;
}

/** Named budgets so every call site agrees on its ceiling. */
export const RATE_LIMITS = {
  /** Login/signup code request — per IP. */
  otpSend: { max: 5, windowSeconds: 60 },
  /** Login/signup code request — per email, stops email bombing one inbox. */
  otpSendPerEmail: { max: 3, windowSeconds: 300 },
  /** Code verification — per IP. */
  otpVerify: { max: 10, windowSeconds: 60 },
  /** Code verification — per email, complements the D1 attempt lockout. */
  otpVerifyPerEmail: { max: 10, windowSeconds: 300 },
  /** Public contact / agency enquiry form. */
  contact: { max: 5, windowSeconds: 300 },
  /** Manual payment proof submission. */
  billing: { max: 5, windowSeconds: 60 },
  /** Admin mutations — a human never needs more than this. */
  admin: { max: 20, windowSeconds: 60 },
  /** Outbound Meta Graph API calls (reels list) and CSV exports. */
  expensive: { max: 30, windowSeconds: 60 },
  /** Everything else that mutates state. */
  write: { max: 120, windowSeconds: 60 },
  /** Fallback for authenticated reads. */
  read: { max: 300, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitOptions>;

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

function memoryConsume(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowSeconds * 1000;
    memoryBuckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: options.max,
      remaining: options.max - 1,
      retryAfterSeconds: options.windowSeconds,
    };
  }

  existing.count += 1;

  // Keep the fallback map from growing without bound on a hot isolate.
  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets) {
      if (v.resetAt <= now) memoryBuckets.delete(k);
    }
    if (memoryBuckets.size > 5000) memoryBuckets.clear();
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= options.max,
    limit: options.max,
    remaining: Math.max(0, options.max - existing.count),
    retryAfterSeconds,
  };
}

/**
 * Counts one hit against `key`. Never throws: a database problem downgrades to
 * the in-memory limiter rather than failing the request.
 */
export async function consumeRateLimit(
  db: D1Database | undefined,
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (!db) return memoryConsume(key, options);

  const windowSeconds = Math.max(1, Math.floor(options.windowSeconds));
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);

  try {
    const row = (await db
      .prepare(
        `INSERT INTO rate_limits (bucket, window_start, count)
         VALUES (?, ?, 1)
         ON CONFLICT(bucket) DO UPDATE SET
           count = CASE
             WHEN rate_limits.window_start = excluded.window_start
             THEN rate_limits.count + 1
             ELSE 1
           END,
           window_start = excluded.window_start
         RETURNING count, window_start`
      )
      .bind(key, windowStart)
      .first()) as { count?: number; window_start?: number } | null;

    const count = Number(row?.count ?? 1);
    const startedAt = Number(row?.window_start ?? windowStart);

    // Opportunistic cleanup: one in every ~64 calls prunes expired windows.
    if (Math.random() < 1 / 64) {
      await db
        .prepare(`DELETE FROM rate_limits WHERE window_start < ?`)
        .bind(now - 86_400)
        .run()
        .catch(() => undefined);
    }

    return {
      allowed: count <= options.max,
      limit: options.max,
      remaining: Math.max(0, options.max - count),
      retryAfterSeconds: Math.max(1, startedAt + windowSeconds - now),
    };
  } catch {
    return memoryConsume(key, options);
  }
}

/** Best-effort, privacy-preserving client identifier. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("cf-connecting-ip");
  if (forwarded) return forwarded.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
