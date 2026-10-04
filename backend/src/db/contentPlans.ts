import type { D1Database } from "@cloudflare/workers-types";
import type { AccountId, AutomationId } from "../types/ids";
import { createAccountId, createAutomationId } from "../types/ids";

/**
 * Content planning queries (plan.md §7 Phase 2 — the competitive gap).
 *
 * RELO's pitch is everything that happens *after* you publish. Rivals bundle the
 * half before that too. This closes it without pretending we schedule posts for
 * the creator — Meta has no content-publishing API. We plan the idea and its
 * trigger keywords here, and the moment the Reel is actually live the creator
 * links it to the automation that handles its comments.
 *
 * That honesty matters: `instagram_media_id` stays NULL until the creator
 * publishes in the Instagram app themselves. We never fake it.
 */

export type ContentStatus = "idea" | "drafting" | "scheduled" | "published";

export interface ContentPlan {
  id: string;
  accountId: AccountId;
  title: string;
  hook?: string;
  caption?: string;
  status: ContentStatus;
  plannedFor: number;
  instagramMediaId?: string;
  automationId?: AutomationId;
  createdAt: number;
  updatedAt: number;
}

export interface ContentPlanInput {
  title: string;
  hook?: string;
  caption?: string;
  status?: ContentStatus;
  plannedFor?: number;
  instagramMediaId?: string;
  automationId?: string;
}

const VALID_STATUSES: ContentStatus[] = ["idea", "drafting", "scheduled", "published"];

export function isContentStatus(value: unknown): value is ContentStatus {
  return VALID_STATUSES.includes(value as ContentStatus);
}

function mapPlan(row: any): ContentPlan {
  return {
    id: row.id,
    accountId: createAccountId(row.account_id),
    title: row.title,
    hook: row.hook || undefined,
    caption: row.caption || undefined,
    status: row.status,
    plannedFor: Number(row.planned_for || 0),
    instagramMediaId: row.instagram_media_id || undefined,
    automationId: row.automation_id ? createAutomationId(row.automation_id) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getContentPlans(db: D1Database, accountId: AccountId): Promise<ContentPlan[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM content_plans
       WHERE account_id = ?
       ORDER BY planned_for DESC, created_at DESC`
    )
    .bind(accountId)
    .all();
  return (results || []).map(mapPlan);
}

export async function getContentPlanById(
  db: D1Database,
  planId: string,
  accountId: AccountId
): Promise<ContentPlan | null> {
  const row = (await db
    .prepare(`SELECT * FROM content_plans WHERE id = ? AND account_id = ? LIMIT 1`)
    .bind(planId, accountId)
    .first()) as any;
  return row ? mapPlan(row) : null;
}

export async function insertContentPlan(
  db: D1Database,
  planId: string,
  accountId: AccountId,
  input: ContentPlanInput
): Promise<ContentPlan> {
  await db
    .prepare(
      `INSERT INTO content_plans
         (id, account_id, title, hook, caption, status, planned_for, instagram_media_id, automation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      planId,
      accountId,
      input.title,
      input.hook ?? null,
      input.caption ?? null,
      input.status ?? "idea",
      input.plannedFor ?? 0,
      input.instagramMediaId ?? null,
      input.automationId ?? null
    )
    .run();
  return (await getContentPlanById(db, planId, accountId))!;
}

export async function updateContentPlan(
  db: D1Database,
  planId: string,
  accountId: AccountId,
  patch: ContentPlanInput
): Promise<ContentPlan | null> {
  const existing = await getContentPlanById(db, planId, accountId);
  if (!existing) return null;
  await db
    .prepare(
      `UPDATE content_plans
       SET title = ?, hook = ?, caption = ?, status = ?, planned_for = ?,
           instagram_media_id = ?, automation_id = ?, updated_at = unixepoch()
       WHERE id = ? AND account_id = ?`
    )
    .bind(
      patch.title ?? existing.title,
      patch.hook ?? existing.hook ?? null,
      patch.caption ?? existing.caption ?? null,
      patch.status ?? existing.status,
      patch.plannedFor ?? existing.plannedFor,
      patch.instagramMediaId ?? existing.instagramMediaId ?? null,
      patch.automationId ?? existing.automationId ?? null,
      planId,
      accountId
    )
    .run();
  return getContentPlanById(db, planId, accountId);
}

export async function deleteContentPlan(
  db: D1Database,
  planId: string,
  accountId: AccountId
): Promise<boolean> {
  const res = await db
    .prepare(`DELETE FROM content_plans WHERE id = ? AND account_id = ?`)
    .bind(planId, accountId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export interface ContentStats {
  idea: number;
  drafting: number;
  scheduled: number;
  published: number;
  /** Published plans that went on to generate at least one DM. */
  converting: number;
}

/**
 * Rollup for the planner header. "Converting" joins through the automation and
 * jobs rather than being stored, so it can never drift from the real funnel.
 */
export async function getContentStats(
  db: D1Database,
  accountId: AccountId
): Promise<ContentStats> {
  const row = (await db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'idea' THEN 1 ELSE 0 END) AS idea,
         SUM(CASE WHEN status = 'drafting' THEN 1 ELSE 0 END) AS drafting,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
         SUM(CASE WHEN status = 'published' AND automation_id IS NOT NULL
                   AND EXISTS (SELECT 1 FROM jobs j
                               WHERE j.matched_automation_id = content_plans.automation_id
                                 AND j.status = 'completed')
                  THEN 1 ELSE 0 END) AS converting
       FROM content_plans WHERE account_id = ?`
    )
    .bind(accountId)
    .first()) as any;

  return {
    idea: Number(row?.idea || 0),
    drafting: Number(row?.drafting || 0),
    scheduled: Number(row?.scheduled || 0),
    published: Number(row?.published || 0),
    converting: Number(row?.converting || 0),
  };
}
