import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import type { AccountId } from "../types/ids";
import { createAccountId } from "../types/ids";

/**
 * Link-in-bio queries (plan.md §4.5 / Phase 2).
 *
 * Split out of queries.ts because this surface has one caller (the router) and
 * its own concern: a PUBLIC page that must be readable without a login while
 * the block list is click-tracked through the same short-link funnel as DMs.
 */

export interface LinkPage {
  id: string;
  accountId: AccountId;
  slug?: string;
  headline?: string;
  bio?: string;
  theme: "volt" | "plain" | "dark";
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LinkBlock {
  id: string;
  pageId: string;
  /** Existing short link — when set, clicks increment its counter. */
  shortLinkId?: string;
  productId?: string;
  targetUrl: string;
  label: string;
  position: number;
  clickCount: number;
  isActive: boolean;
}

function mapPage(row: any): LinkPage {
  return {
    id: row.id,
    accountId: createAccountId(row.account_id),
    slug: row.slug || undefined,
    headline: row.headline || undefined,
    bio: row.bio || undefined,
    theme: row.theme || "volt",
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBlock(row: any): LinkBlock {
  return {
    id: row.id,
    pageId: row.page_id,
    shortLinkId: row.short_link_id || undefined,
    productId: row.product_id || undefined,
    targetUrl: row.target_url,
    label: row.label,
    position: Number(row.position || 0),
    clickCount: Number(row.click_count || 0),
    isActive: Boolean(row.is_active),
  };
}

export async function getLinkPageForAccount(
  db: D1Database,
  accountId: AccountId
): Promise<LinkPage | null> {
  const row = (await db
    .prepare(`SELECT * FROM link_pages WHERE account_id = ? LIMIT 1`)
    .bind(accountId)
    .first()) as any;
  return row ? mapPage(row) : null;
}

export async function getLinkPageBySlug(
  db: D1Database,
  slug: string
): Promise<LinkPage | null> {
  const row = (await db
    .prepare(`SELECT * FROM link_pages WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first()) as any;
  return row ? mapPage(row) : null;
}

export async function getLinkPageById(
  db: D1Database,
  pageId: string
): Promise<LinkPage | null> {
  const row = (await db
    .prepare(`SELECT * FROM link_pages WHERE id = ? LIMIT 1`)
    .bind(pageId)
    .first()) as any;
  return row ? mapPage(row) : null;
}

export async function upsertLinkPage(
  db: D1Database,
  accountId: AccountId,
  patch: {
    slug?: string | null;
    headline?: string;
    bio?: string;
    theme?: "volt" | "plain" | "dark";
    isPublished?: boolean;
  }
): Promise<LinkPage> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO link_pages (id, account_id, slug, headline, bio, theme, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(account_id) DO UPDATE SET
         slug = excluded.slug,
         headline = excluded.headline,
         bio = excluded.bio,
         theme = excluded.theme,
         is_published = excluded.is_published,
         updated_at = ?`
    )
    .bind(
      crypto.randomUUID(),
      accountId,
      patch.slug ?? null,
      patch.headline ?? null,
      patch.bio ?? null,
      patch.theme || "volt",
      patch.isPublished ? 1 : 0,
      now,
      now,
      now
    )
    .run();

  return (await getLinkPageForAccount(db, accountId))!;
}

export async function getLinkBlocks(db: D1Database, pageId: string): Promise<LinkBlock[]> {
  const { results } = await db
    .prepare(
      `SELECT id, page_id, short_link_id, product_id, target_url, label, position, click_count, is_active
       FROM link_blocks
       WHERE page_id = ?
       ORDER BY position ASC`
    )
    .bind(pageId)
    .all();
  return (results || []).map(mapBlock);
}

export async function replaceLinkBlocks(
  db: D1Database,
  pageId: string,
  blocks: Array<{ id: string; shortLinkId?: string; productId?: string; targetUrl: string; label: string }>
): Promise<LinkBlock[]> {
  // Full replace keeps ordering simple; the block count is capped by the router
  // so this is never a hot path. Click counts are carried over for blocks whose
  // id survived the save — losing them on every edit would silently reset the
  // creator's only click history.
  const previous = await getLinkBlocks(db, pageId);
  const clicksById = new Map(previous.map((block) => [block.id, block.clickCount]));

  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM link_blocks WHERE page_id = ?`).bind(pageId),
  ];

  let position = 0;
  for (const block of blocks) {
    statements.push(
      db
        .prepare(
          `INSERT INTO link_blocks
             (id, page_id, short_link_id, product_id, target_url, label, position, click_count, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
        )
        .bind(
          block.id,
          pageId,
          block.shortLinkId ?? null,
          block.productId ?? null,
          block.targetUrl,
          block.label,
          position++,
          clicksById.get(block.id) ?? 0
        )
    );
  }

  statements.push(
    db.prepare(`UPDATE link_pages SET updated_at = unixepoch() WHERE id = ?`).bind(pageId)
  );

  await db.batch(statements);
  return getLinkBlocks(db, pageId);
}

/**
 * Public click endpoint for a block. Clicks increment the block's own counter
 * (not a short_links row — that table is scoped to automations) and then
 * redirect to the creator's target URL.
 */
export async function getAndTrackLinkBlock(
  db: D1Database,
  blockId: string
): Promise<{ targetUrl: string } | null> {
  const row = (await db
    .prepare(
      `SELECT b.target_url
         FROM link_blocks b
         JOIN link_pages p ON p.id = b.page_id
        WHERE b.id = ? AND b.is_active = 1 AND p.is_published = 1
        LIMIT 1`
    )
    .bind(blockId)
    .first()) as any;
  if (!row) return null;
  await db
    .prepare(`UPDATE link_blocks SET click_count = click_count + 1 WHERE id = ?`)
    .bind(blockId)
    .run();
  return { targetUrl: row.target_url };
}

/**
 * The public payload. Returns null when the page is unpublished so an
 * unconfigured creator never leaks a half-built page at a guessable URL.
 */
export async function getPublishedLinkPage(
  db: D1Database,
  pageId: string
): Promise<(LinkPage & { blocks: LinkBlock[]; username: string }) | null> {
  const row = (await db
    .prepare(`SELECT * FROM link_pages WHERE id = ? AND is_published = 1 LIMIT 1`)
    .bind(pageId)
    .first()) as any;
  if (!row) return null;

  const account = (await db
    .prepare(`SELECT username, profile_picture_url FROM connected_accounts WHERE id = ? LIMIT 1`)
    .bind(row.account_id)
    .first()) as any;

  const blocks = await getLinkBlocks(db, pageId);
  return {
    ...mapPage(row),
    blocks: blocks.filter((b) => b.isActive),
    username: account?.username || "",
  };
}
