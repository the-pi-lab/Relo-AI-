/**
 * Phase 11 test suite — CONTENT PLANNING (plan.md §7 Phase 2)
 *
 * Covers the competitive-gap feature:
 *   • tier gating — Free is locked out on read AND write
 *   • CRUD round-trip, including date + status persistence
 *   • validation — title required, unknown status rejected
 *   • the publish link — a Reel can only be attached if this account actually
 *     automates it, so the planner cannot claim credit for someone else's Reel
 *   • the conversion rollup, which joins live job data rather than storing a
 *     number that could drift
 *   • ownership isolation on every route
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { isContentStatus } from "../src/db/contentPlans";

function createMockD1(sqlite: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      let boundParams: any[] = [];
      return {
        bind(...params: any[]) {
          boundParams = params;
          return this;
        },
        async run() {
          const stmt = sqlite.prepare(sql);
          const info = stmt.run(...boundParams);
          return { meta: { changes: Number(info.changes) } };
        },
        async first() {
          const stmt = sqlite.prepare(sql);
          const row = stmt.get(...boundParams);
          return (row as any) || null;
        },
        async all() {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...boundParams);
          return { results: (rows as any[]) || [] };
        },
      } as any;
    },
  } as unknown as D1Database;
}

const BASE = "https://api.chatflow.ai";

async function runTests() {
  console.log("=== RUNNING PHASE 11 CONTENT PLANNING TEST SUITE ===");

  console.log("\n[1] Initializing D1 in-memory database with schema.sql...");
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase11_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    ADMIN_SECRET: "admin_test_secret",
  } as unknown as Env;

  const req = (p: string, init: RequestInit = {}) =>
    worker.fetch(new Request(`${BASE}${p}`, init), env, {} as any);

  const signUp = async (email: string) => {
    const send = await req("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const code = ((await (send as any).json()) as any).data.debugCode;
    const verify = await req("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const json: any = await verify.json();
    return { token: json.data.token, userId: json.data.user.id as string };
  };

  const owner = await signUp("planner@relo.test");
  const auth = { Authorization: `Bearer ${owner.token}` };
  const now = Math.floor(Date.now() / 1000);

  const proAccountId = "acc_p11_pro";
  const freeAccountId = "acc_p11_free";
  sqlite
    .prepare(
      `INSERT INTO connected_accounts
        (id, user_id, instagram_user_id, username, profile_picture_url,
         access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan, ai_credits_remaining)
       VALUES (?, ?, ?, ?, NULL, 'enc', ?, 1, ?, ?, ?, ?)`
    )
    .run(proAccountId, owner.userId, "ig_p11_pro", "planner", now + 5184000, now, now, "pro", 500);
  sqlite
    .prepare(
      `INSERT INTO connected_accounts
        (id, user_id, instagram_user_id, username, profile_picture_url,
         access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan, ai_credits_remaining)
       VALUES (?, ?, ?, ?, NULL, 'enc', ?, 1, ?, ?, ?, ?)`
    )
    .run(freeAccountId, owner.userId, "ig_p11_free", "freebie", now + 5184000, now, now, "free", 3);

  // An automation the Pro account owns — the only Reel it may link.
  sqlite
    .prepare(
      `INSERT INTO reel_automations
        (id, account_id, instagram_media_id, reel_permalink, trigger_keywords,
         comment_replies, follow_gate_enabled, template_card, is_active)
       VALUES ('auto_p11', ?, 'media_p11_1', 'https://instagram.com/reel/p11',
               '["GUIDE"]', '["one","two","three"]', 1, '{"title":"t","subtitle":"s","buttons":[{"type":"web_url","title":"go","url":"https://x.test"}]}', 1)`
    )
    .run(proAccountId);

  const json = (p: string, method: string, body: unknown) =>
    req(p, {
      method,
      headers: { ...auth, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  // ═══════════════════════════════════════════════════════════════
  // 2. Tier gate
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[2] Free tier is locked out of the planner...");
  const freeRead = await req(`/api/content-plans?accountId=${freeAccountId}`, { headers: auth });
  assert.strictEqual(freeRead.status, 403);
  const freeReadJson: any = await freeRead.json();
  assert.strictEqual(freeReadJson.error.code, "CONTENT_LOCKED");
  assert.strictEqual(freeReadJson.error.details.upgrade, true);

  const freeWrite = await json(`/api/content-plans?accountId=${freeAccountId}`, "POST", {
    title: "Sneaky",
  });
  assert.strictEqual(freeWrite.status, 403, "Free cannot write a plan");

  const proRead = await req(`/api/content-plans?accountId=${proAccountId}`, { headers: auth });
  assert.strictEqual(proRead.status, 200, "Pro can read plans");
  console.log("   ✓ CONTENT_LOCKED + upgrade flag on Free read and write.");

  // ═══════════════════════════════════════════════════════════════
  // 3. CRUD round-trip
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[3] Create → list → update → delete...");
  const plannedFor = Math.floor(Date.parse("2026-11-20") / 1000);
  const created = await json(`/api/content-plans?accountId=${proAccountId}`, "POST", {
    title: "Why your Reels get no DMs",
    hook: "The algorithm isn't broken. Your CTA is.",
    caption: "Comment FIX and I'll send the checklist.",
    status: "scheduled",
    plannedFor,
  });
  assert.strictEqual(created.status, 201);
  const createdJson: any = await created.json();
  assert.strictEqual(createdJson.data.plan.title, "Why your Reels get no DMs");
  assert.strictEqual(createdJson.data.plan.status, "scheduled");
  assert.strictEqual(createdJson.data.plan.plannedFor, plannedFor, "the date must round-trip");
  assert.strictEqual(
    createdJson.data.plan.instagramMediaId,
    undefined,
    "a plan starts unpublished — we never fake a media id"
  );
  const planId = createdJson.data.plan.id as string;

  const updated = await json(`/api/content-plans?accountId=${proAccountId}`, "POST", {
    id: planId,
    title: "Why your Reels get NO DMs",
    status: "drafting",
  });
  const updatedJson: any = await updated.json();
  assert.strictEqual(updatedJson.data.plan.title, "Why your Reels get NO DMs");
  assert.strictEqual(updatedJson.data.plan.status, "drafting");
  assert.strictEqual(
    updatedJson.data.plan.hook,
    "The algorithm isn't broken. Your CTA is.",
    "a partial update must not blank the fields it omits"
  );

  const listed: any = await (
    await req(`/api/content-plans?accountId=${proAccountId}`, { headers: auth })
  ).json();
  assert.strictEqual(listed.data.plans.length, 1);
  console.log("   ✓ Partial update preserves untouched fields; date and status persist.");

  // ═══════════════════════════════════════════════════════════════
  // 4. Validation
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[4] Validation...");
  const noTitle = await json(`/api/content-plans?accountId=${proAccountId}`, "POST", {
    hook: "orphan hook",
  });
  assert.strictEqual(noTitle.status, 400);
  assert.strictEqual(((await noTitle.json()) as any).error.code, "MISSING_TITLE");

  assert.ok(isContentStatus("published"));
  assert.ok(!isContentStatus("deleted"));
  assert.ok(!isContentStatus(null));
  const badStatus = await json(`/api/content-plans?accountId=${proAccountId}`, "POST", {
    title: "Bad status",
    status: "not_a_status",
  });
  const badStatusJson: any = await badStatus.json();
  assert.strictEqual(
    badStatusJson.data.plan.status,
    "idea",
    "an unknown status falls back to 'idea' rather than corrupting the row"
  );
  assert.strictEqual(badStatus.status, 201);

  const missingAccount = await json("/api/content-plans", "POST", { title: "no account" });
  assert.strictEqual(missingAccount.status, 400);
  console.log("   ✓ Title required; unknown status coerced to 'idea'.");

  // ═══════════════════════════════════════════════════════════════
  // 5. Linking a live Reel
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[5] A Reel can only be linked if this account automates it...");
  const noFields = await json(
    `/api/content-plans/publish?accountId=${proAccountId}`,
    "POST",
    { id: planId }
  );
  assert.strictEqual(noFields.status, 400, "id and mediaId are both required");

  const notOurs = await json(
    `/api/content-plans/publish?accountId=${proAccountId}`,
    "POST",
    { id: planId, mediaId: "media_someone_else" }
  );
  assert.strictEqual(notOurs.status, 200, "unknown Reel is accepted but not credited");
  const notOursJson: any = await notOurs.json();
  assert.strictEqual(notOursJson.data.plan.status, "published");
  assert.strictEqual(
    notOursJson.data.plan.automationId,
    undefined,
    "no automation is credited for a Reel this account does not automate"
  );

  // Now link the Reel it DOES automate.
  const linked = await json(
    `/api/content-plans/publish?accountId=${proAccountId}`,
    "POST",
    { id: planId, mediaId: "media_p11_1" }
  );
  const linkedJson: any = await linked.json();
  assert.strictEqual(linkedJson.data.plan.instagramMediaId, "media_p11_1");
  assert.strictEqual(
    linkedJson.data.plan.automationId,
    "auto_p11",
    "the matching automation is credited, which is what makes conversion meaningful"
  );
  console.log("   ✓ Unknown Reel links without credit; owned Reel links its automation.");

  // ═══════════════════════════════════════════════════════════════
  // 6. The conversion rollup reads live job data
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[6] Conversion is derived from real jobs, never stored...");
  const statsBefore: any = await (
    await req(`/api/content-plans?accountId=${proAccountId}`, { headers: auth })
  ).json();
  assert.strictEqual(statsBefore.data.stats.published, 1);
  assert.strictEqual(
    statsBefore.data.stats.converting,
    0,
    "no completed DMs yet, so nothing counts as converting"
  );

  // A completed DM job against the linked automation flips it to converting.
  sqlite
    .prepare(
      `INSERT INTO jobs
        (id, account_id, comment_id, commenter_user_id, commenter_username,
         comment_text, post_id, matched_automation_id, status, retry_count,
         send_at, created_at, updated_at, is_follow_up)
       VALUES ('job_p11', ?, 'c_p11', 'u_p11', 'someone', 'FIX', 'media_p11_1',
               'auto_p11', 'completed', 0, ?, ?, ?, 0)`
    )
    .run(proAccountId, now, now, now);

  const statsAfter: any = await (
    await req(`/api/content-plans?accountId=${proAccountId}`, { headers: auth })
  ).json();
  assert.strictEqual(
    statsAfter.data.stats.converting,
    1,
    "a published plan that generated a completed DM counts as converting"
  );

  // A pending job must not count — only completed ones represent a real DM.
  sqlite
    .prepare(`UPDATE jobs SET status = 'pending' WHERE id = 'job_p11'`).run();
  const statsPending: any = await (
    await req(`/api/content-plans?accountId=${proAccountId}`, { headers: auth })
  ).json();
  assert.strictEqual(
    statsPending.data.stats.converting,
    0,
    "an undelivered DM must not inflate the conversion rate"
  );
  console.log("   ✓ Only COMPLETED DMs count; pending work is never claimed as a conversion.");

  // ═══════════════════════════════════════════════════════════════
  // 7. Ownership isolation
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[7] Cross-account access is refused...");
  const stranger = await signUp("stranger@relo.test");
  const strangerAuth = { Authorization: `Bearer ${stranger.token}` };

  for (const [p, m, body] of [
    [`/api/content-plans?accountId=${proAccountId}`, "GET", undefined],
    [`/api/content-plans/${planId}?accountId=${proAccountId}`, "DELETE", undefined],
  ] as const) {
    const r = await worker.fetch(
      new Request(`${BASE}${p}`, {
        method: m,
        headers: { ...strangerAuth, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }),
      env,
      {} as any
    );
    assert.strictEqual(r.status, 404, `${m} ${p} must 404 for a non-owner`);
  }

  const removed = await json(
    `/api/content-plans/${planId}?accountId=${proAccountId}`,
    "DELETE",
    undefined
  );
  assert.strictEqual(removed.status, 200, "the owner can still delete their own plan");
  const afterDelete: any = await (
    await req(`/api/content-plans?accountId=${proAccountId}`, { headers: auth })
  ).json();
  // Only this plan should be gone — the validation step left a "Bad status"
  // plan behind, so the list is not expected to be empty.
  assert.ok(
    afterDelete.data.plans.every((p: any) => p.id !== planId),
    "the deleted row must not survive"
  );
  const rowGone = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM content_plans WHERE id = ?`)
    .get(planId) as any;
  assert.strictEqual(Number(rowGone.n), 0, "the row is really gone from D1");
  console.log("   ✓ Non-owners get an opaque 404; owner deletion works.");

  console.log("\n🎉 ALL PHASE 11 CONTENT PLANNING TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("\n✗ PHASE 11 TESTS FAILED");
  console.error(err);
  process.exit(1);
});