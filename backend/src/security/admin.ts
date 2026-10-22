import type { D1Database } from "@cloudflare/workers-types";
import { timingSafeEqualAsync } from "../crypto";
import type { JwtPayload } from "../auth";

/**
 * Admin authorization.
 *
 * Two ways in, both checked server-side on every request:
 *   1. A user row with `is_admin = 1` (or an email listed in `ADMIN_EMAILS`).
 *   2. The break-glass `X-Admin-Secret` header, compared in constant time,
 *      for when the owner has no admin user yet.
 *
 * Hiding the admin UI is never the control — every `/api/admin/*` request
 * passes through `resolveAdmin` before a handler can run.
 */

export interface AdminActor {
  /** `user` for a real admin account, `secret` for the break-glass header. */
  actorType: "user" | "secret";
  /** User id, or the literal `shared-secret` when the header was used. */
  actorId: string;
  email?: string;
}

export function isAdminEmail(env: { ADMIN_EMAILS?: string }, email: string): boolean {
  const list = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function resolveAdmin(
  request: Request,
  env: { ADMIN_SECRET?: string; ADMIN_EMAILS?: string },
  user: JwtPayload,
  isAdminUser: (userId: string) => Promise<boolean>
): Promise<AdminActor | null> {
  const secret = request.headers.get("x-admin-secret");
  if (secret && env.ADMIN_SECRET) {
    const matches = await timingSafeEqualAsync(secret, env.ADMIN_SECRET);
    if (matches) {
      return { actorType: "secret", actorId: "shared-secret" };
    }
  }

  if (isAdminEmail(env, user.email)) {
    return { actorType: "user", actorId: user.sub, email: user.email };
  }

  try {
    if (await isAdminUser(user.sub)) {
      return { actorType: "user", actorId: user.sub, email: user.email };
    }
  } catch {
    // A missing `is_admin` column must not 500 the endpoint; the two checks
    // above already ran.
  }

  return null;
}

export interface AdminAuditEntry {
  actor: AdminActor;
  action: string;
  targetType?: string;
  targetId?: string;
  success: boolean;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/**
 * Append-only admin audit trail. Never throws: an audit write failure must not
 * roll back the action it describes, but it is logged so the gap is visible.
 */
export async function recordAdminAudit(
  db: D1Database | undefined,
  entry: AdminAuditEntry
): Promise<void> {
  if (!db) return;

  try {
    await db
      .prepare(
        `INSERT INTO admin_audit_log (
           id, actor_type, actor_id, actor_email, action,
           target_type, target_id, success, ip, metadata, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        entry.actor.actorType,
        entry.actor.actorId,
        entry.actor.email || null,
        entry.action.slice(0, 120),
        entry.targetType || null,
        entry.targetId || null,
        entry.success ? 1 : 0,
        entry.ip || null,
        entry.metadata ? JSON.stringify(entry.metadata).slice(0, 4000) : null,
        Math.floor(Date.now() / 1000)
      )
      .run();
  } catch (error) {
    console.error("[Admin Audit] failed to persist entry:", error);
  }
}
