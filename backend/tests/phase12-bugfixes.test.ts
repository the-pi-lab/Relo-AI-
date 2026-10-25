/**
 * Phase 12 — regression suite for the security/correctness review.
 *
 * Every case here failed against the code before this suite existed:
 *   1. a client-supplied automation id skipped the free-tier slot check
 *   2. deleting an automation that had ever matched a job returned a 500
 *   3. follow-up jobs inserted zero rows (comment_id collided with the parent)
 *   4. the webhook handshake passed with an unset META_VERIFY_TOKEN
 *   5. disconnecting an account reset the plan, the free slot and payments
 *   6. link-in-bio public URLs pointed at the app instead of the Worker, and
 *      block clicks were never counted
 *   7. agency enquiries were deleted by the 7-day retention purge
 *
 * Runs against the real schema.sql and the real Worker/router via an in-memory
 * SQLite D1 mock, like the other suites.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { encryptSecret } from "../src/crypto";
import {
  activatePlanForUser,
  deleteConnectedAccount,
  insertFollowUpJob,
  purgeRetentionData,
  upsertConnectedAccount,
} from "../src/db/queries";
import { processDueJobsBatch } from "../src/engine/processor";

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
          return ((stmt.get(...boundParams) as any) || null) as any;
        },
        async all() {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...boundParams);
          return { results: (rows as any[]) || [] };
        },
      } as any;
    },
    async batch(stmts: any[]) {
      const results: any[] = [];
      for (const stmt of stmts) results.push(await stmt.run());
      return results;
    },
  } as unknown as D1Database;
}

const BASE = "https://api.relo.test";

async function runTests() {
  console.log("=== RUNNING PHASE 12 BUGFIX REGRESSION SUITE ===");

  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase12_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    META_APP_SECRET: "meta_app_secret_phase12",
    META_VERIFY_TOKEN: "", // deliberately unset: the handshake must fail closed
    PUBLIC_BASE_URL: "https://engine.relo.test",
    PUBLIC_APP_URL: "https://app.relo.test",
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
    return {
      token: json.data.token as string,
      userId: json.data.user.id as string,
      auth: { Authorization: `Bearer ${json.data.token}`, "Content-Type": "application/json" },
    };
  };

  const now = Math.floor(Date.now() / 1000);

  // ════════════════════════════════════════════════════════════════
  // 1. A client-supplied id cannot skip the free-tier slot
  // ════════════════════════════════════════════════════════════════
  console.log("\n[1] A client-supplied automation id cannot bypass the free tier...");
  const free = await signUp("free@phase12.test");
  const freeAccountId = "acc_p12_free";
  await upsertConnectedAccount(mockDb, {
    id: freeAccountId,
    userId: free.userId,
    instagramUserId: "ig_p12_free",
    username: "free.creator",
    accessTokenEncrypted: await encryptSecret("EAAB_free_token", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now + 5184000,
  });

  const automationBody = (id: string) => ({
    id,
    accountId: freeAccountId,
    instagramMediaId: "reel_p12_1",
    reelPermalink: "https://instagram.com/reel/p12",
    triggerKeywords: ["GUIDE"],
    commentReplies: ["Sent! @username", "Check your DMs @username"],
    templateCard: {
      title: "Free blueprint",
      buttons: [{ type: "web_url", title: "Get it", url: "https://shop.test/blueprint" }],
    },
    isActive: true,
  });

  const firstCreate = await req("/api/automations", {
    method: "POST",
    headers: free.auth,
    body: JSON.stringify(automationBody("auto_p12_first")),
  });
  assert.strictEqual(firstCreate.status, 200, "the first free automation is allowed");

  const secondCreate = await req("/api/automations", {
    method: "POST",
    headers: free.auth,
    body: JSON.stringify({
      ...automationBody("auto_p12_second"),
      instagramMediaId: "reel_p12_2",
      reelPermalink: "https://instagram.com/reel/p12b",
    }),
  });
  assert.strictEqual(
    secondCreate.status,
    403,
    "a second create must be refused even when the client sends an id"
  );
  assert.strictEqual(((await secondCreate.json()) as any).error.code, "FREE_REEL_LIMIT");

  const updateFirst = await req("/api/automations", {
    method: "POST",
    headers: free.auth,
    body: JSON.stringify({ ...automationBody("auto_p12_first"), isActive: false }),
  });
  assert.strictEqual(updateFirst.status, 200, "an update to the existing rule is still allowed");
  console.log("   ✓ Create is decided by the DB, not by the presence of `id`.");

  // ════════════════════════════════════════════════════════════════
  // 2. Deleting an automation with job history does not 500
  // ════════════════════════════════════════════════════════════════
  console.log("\n[2] Deleting an automation detaches its job history instead of failing...");
  sqlite
    .prepare(
      `INSERT INTO jobs
        (id, account_id, comment_id, commenter_user_id, commenter_username,
         comment_text, post_id, matched_automation_id, status, retry_count, send_at,
         created_at, updated_at, is_follow_up)
       VALUES ('job_p12_history', ?, 'comment_p12_history', 'ig_commenter', 'someone',
               'GUIDE', 'reel_p12_1', 'auto_p12_first', 'completed', 0, ?, ?, ?, 0)`
    )
    .run(freeAccountId, now, now, now);

  const deleted = await req(`/api/automations/auto_p12_first?accountId=${freeAccountId}`, {
    method: "DELETE",
    headers: free.auth,
  });
  assert.strictEqual(deleted.status, 200, "delete must succeed with job rows present");
  const detached = sqlite
    .prepare(`SELECT matched_automation_id FROM jobs WHERE id = 'job_p12_history'`)
    .get() as any;
  assert.strictEqual(
    detached.matched_automation_id,
    null,
    "the job keeps its history but loses the dangling pointer"
  );
  const automationGone = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM reel_automations WHERE id = 'auto_p12_first'`)
    .get() as any;
  assert.strictEqual(Number(automationGone.n), 0, "the automation row is gone");
  console.log("   ✓ Jobs are detached in the same transaction; no FK failure.");

  // ════════════════════════════════════════════════════════════════
  // 3. Follow-up jobs are actually inserted, uniquely
  // ════════════════════════════════════════════════════════════════
  console.log("\n[3] Follow-up jobs insert with a synthetic unique key...");
  sqlite
    .prepare(
      `INSERT INTO jobs
        (id, account_id, comment_id, commenter_user_id, commenter_username,
         comment_text, post_id, matched_automation_id, status, retry_count, send_at,
         created_at, updated_at, is_follow_up)
       VALUES ('job_p12_parent', ?, 'comment_p12_parent', 'ig_follow_lead', 'lead',
               'GUIDE', 'reel_p12_1', NULL, 'completed', 0, ?, ?, ?, 0)`
    )
    .run(freeAccountId, now, now, now);

  // A second automation to attach the follow-up to (the first was deleted).
  sqlite
    .prepare(
      `INSERT INTO reel_automations
        (id, account_id, instagram_media_id, reel_permalink, trigger_keywords,
         comment_replies, template_card, is_active, follow_up_enabled, follow_up_delay_minutes)
       VALUES ('auto_p12_follow', ?, 'reel_p12_1', 'https://instagram.com/reel/p12',
               '["GUIDE"]', '["a @username","b @username"]',
               '{"title":"t","buttons":[{"type":"web_url","title":"Get","url":"https://shop.test/x"}]}',
               1, 1, 60)`
    )
    .run(freeAccountId);

  const inserted = await insertFollowUpJob(mockDb, {
    id: "job_p12_followup" as any,
    accountId: freeAccountId as any,
    commenterUserId: "ig_follow_lead" as any,
    commenterUsername: "lead",
    postId: "reel_p12_1" as any,
    matchedAutomationId: "auto_p12_follow" as any,
    parentJobId: "job_p12_parent" as any,
    sendAt: now + 3600,
  });
  assert.strictEqual(inserted, true, "the follow-up row is created");

  const followRow = sqlite
    .prepare(
      `SELECT comment_id, is_follow_up, parent_job_id, status FROM jobs WHERE id = 'job_p12_followup'`
    )
    .get() as any;
  assert.strictEqual(followRow.is_follow_up, 1);
  assert.strictEqual(followRow.comment_id, "followup:job_p12_parent", "unique synthetic key");
  assert.strictEqual(followRow.parent_job_id, "job_p12_parent");

  const duplicate = await insertFollowUpJob(mockDb, {
    id: "job_p12_followup_dup" as any,
    accountId: freeAccountId as any,
    commenterUserId: "ig_follow_lead" as any,
    commenterUsername: "lead",
    postId: "reel_p12_1" as any,
    matchedAutomationId: "auto_p12_follow" as any,
    parentJobId: "job_p12_parent" as any,
    sendAt: now + 7200,
  });
  assert.strictEqual(duplicate, false, "a retried parent does not schedule a second follow-up");
  const followCount = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM jobs WHERE is_follow_up = 1`)
    .get() as any;
  assert.strictEqual(Number(followCount.n), 1);
  console.log("   ✓ Insert works, stays idempotent, and never reuses the parent's key.");

  // A follow-up whose 24h window has closed is skipped, not retried forever.
  sqlite
    .prepare(
      `INSERT INTO captured_leads
        (id, account_id, instagram_scoped_id, username, total_dms_sent,
         first_interaction_at, last_interaction_at, last_inbound_at)
       VALUES ('lead_p12_stale', ?, 'ig_follow_lead', 'lead', 1, ?, ?, 0)`
    )
    .run(freeAccountId, now - 2 * 86400, now - 2 * 86400);
  sqlite
    .prepare(`UPDATE jobs SET send_at = ?, created_at = ? WHERE id = 'job_p12_followup'`)
    .run(now - 1, now - 86400);

  const batch = await processDueJobsBatch(env, { batchLimit: 5 });
  assert.ok(batch.processedCount >= 1, "the follow-up was picked up");
  const closed = sqlite
    .prepare(`SELECT status, response_mid FROM jobs WHERE id = 'job_p12_followup'`)
    .get() as any;
  assert.strictEqual(closed.status, "completed");
  assert.strictEqual(closed.response_mid, "SKIPPED_WINDOW_CLOSED", "closed window is a clean skip");
  console.log("   ✓ Closed messaging window is skipped before any Graph API call.");

  // ════════════════════════════════════════════════════════════════
  // 4. Webhook handshake fails closed without a secret
  // ════════════════════════════════════════════════════════════════
  console.log("\n[4] The webhook handshake refuses an empty verify token...");
  const emptyToken = await req(
    "/webhook?hub.mode=subscribe&hub.verify_token=&hub.challenge=abc123"
  );
  assert.strictEqual(emptyToken.status, 403, "an unset secret must never match an empty token");

  env.META_VERIFY_TOKEN = "real_verify_token";
  const goodToken = await req(
    "/webhook?hub.mode=subscribe&hub.verify_token=real_verify_token&hub.challenge=abc123"
  );
  assert.strictEqual(goodToken.status, 200);
  assert.strictEqual(await goodToken.text(), "abc123");
  console.log("   ✓ Empty secret fails closed; a configured secret still completes the handshake.");

  // ════════════════════════════════════════════════════════════════
  // 5. Disconnect + reconnect keeps plan, free slot and payments
  // ════════════════════════════════════════════════════════════════
  console.log("\n[5] Disconnect + reconnect preserves the paid plan and payment history...");
  const paid = await signUp("paid@phase12.test");
  const paidAccountId = "acc_p12_paid";
  await upsertConnectedAccount(mockDb, {
    id: paidAccountId,
    userId: paid.userId,
    instagramUserId: "ig_p12_paid",
    username: "paid.creator",
    accessTokenEncrypted: await encryptSecret("EAAB_paid_token", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now + 5184000,
  });
  await activatePlanForUser(mockDb, paid.userId, "pro");
  sqlite
    .prepare(
      `UPDATE connected_accounts SET free_reel_consumed = 1 WHERE id = ?`
    )
    .run(paidAccountId);
  sqlite
    .prepare(`UPDATE users SET free_reel_consumed = 1 WHERE id = ?`)
    .run(paid.userId);
  sqlite
    .prepare(
      `INSERT INTO payments (id, account_id, user_id, provider, plan, amount_inr, utr, status)
       VALUES ('pay_p12', ?, ?, 'manual_upi', 'pro', 199, 'UTRP12TEST', 'verified')`
    )
    .run(paidAccountId, paid.userId);

  const disconnected = await deleteConnectedAccount(mockDb, paidAccountId, paid.userId);
  assert.strictEqual(disconnected, true);

  // Soft disconnect: the row stays so automations/leads survive, but it is
  // inactive and its tokens are gone.
  const dormant = sqlite
    .prepare(
      `SELECT is_active, access_token_encrypted, user_token_encrypted
         FROM connected_accounts WHERE id = ?`
    )
    .get(paidAccountId) as any;
  assert.ok(dormant, "the account row is retained for history");
  assert.strictEqual(dormant.is_active, 0, "the account is inactive");
  assert.strictEqual(dormant.access_token_encrypted, "", "the page token is wiped");
  assert.strictEqual(dormant.user_token_encrypted, null, "the user token is wiped");

  const paymentSurvived = sqlite
    .prepare(`SELECT user_id, account_id FROM payments WHERE id = 'pay_p12'`)
    .get() as any;
  assert.ok(paymentSurvived, "the payment row must survive the disconnect");
  assert.strictEqual(paymentSurvived.user_id, paid.userId);
  assert.strictEqual(paymentSurvived.account_id, null, "attribution is detached, not cascaded");

  await upsertConnectedAccount(mockDb, {
    id: "acc_p12_paid_again",
    userId: paid.userId,
    instagramUserId: "ig_p12_paid",
    username: "paid.creator",
    accessTokenEncrypted: await encryptSecret("EAAB_paid_token_2", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now + 5184000,
  });
  // The unique Instagram id resolves to the same durable row; reconnect flips
  // it back to active instead of inserting a duplicate.
  const reconnected = sqlite
    .prepare(
      `SELECT plan, free_reel_consumed, is_active
         FROM connected_accounts WHERE instagram_user_id = 'ig_p12_paid'`
    )
    .get() as any;
  assert.strictEqual(reconnected.is_active, 1, "reconnect reactivates the row");
  assert.strictEqual(reconnected.plan, "pro", "reconnect inherits the user's paid plan");
  assert.strictEqual(reconnected.free_reel_consumed, 1, "the burned free slot stays burned");

  // A second Instagram account for the same paid user must start on Pro too.
  await upsertConnectedAccount(mockDb, {
    id: "acc_p12_paid_second",
    userId: paid.userId,
    instagramUserId: "ig_p12_paid_second",
    username: "paid.second",
    accessTokenEncrypted: await encryptSecret("EAAB_paid_token_3", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now + 5184000,
  });
  const second = sqlite
    .prepare(`SELECT plan FROM connected_accounts WHERE id = 'acc_p12_paid_second'`)
    .get() as any;
  assert.strictEqual(second.plan, "pro", "a new account mirrors the user's plan");
  console.log("   ✓ Plan, free slot and payments all survive delete + reconnect.");

  // ════════════════════════════════════════════════════════════════
  // 6. Link-in-bio URL and click tracking
  // ════════════════════════════════════════════════════════════════
  console.log("\n[6] Link-in-bio URLs point at the Worker and clicks are counted...");
  const pageSave = await req(`/api/link-page?accountId=acc_p12_paid_second`, {
    method: "POST",
    headers: paid.auth,
    body: JSON.stringify({
      slug: "phase12creator",
      headline: "Phase 12",
      theme: "plain",
      isPublished: true,
      blocks: [{ label: "Shop", targetUrl: "https://shop.test/phase12" }],
    }),
  });
  assert.strictEqual(pageSave.status, 200, "a Pro account can publish a link page");
  const pageJson: any = await pageSave.json();
  assert.strictEqual(
    pageJson.data.publicUrl,
    "https://engine.relo.test/b/phase12creator",
    "the public URL must use the Worker origin, not the app origin"
  );
  const blockId = pageJson.data.blocks[0].id as string;

  const click = await req(`/c/${blockId}`);
  assert.strictEqual(click.status, 302, "a block click redirects");
  assert.strictEqual(click.headers.get("Location"), "https://shop.test/phase12");
  const clicks = sqlite
    .prepare(`SELECT click_count FROM link_blocks WHERE id = ?`)
    .get(blockId) as any;
  assert.strictEqual(Number(clicks.click_count), 1, "the block click is counted");

  // Saving again with the same block id keeps the lifetime count.
  const resave = await req(`/api/link-page?accountId=acc_p12_paid_second`, {
    method: "POST",
    headers: paid.auth,
    body: JSON.stringify({
      slug: "phase12creator",
      headline: "Phase 12 (edited)",
      theme: "plain",
      isPublished: true,
      blocks: [{ id: blockId, label: "Shop now", targetUrl: "https://shop.test/phase12" }],
    }),
  });
  assert.strictEqual(resave.status, 200);
  const afterResave = sqlite
    .prepare(`SELECT id, click_count, label FROM link_blocks WHERE page_id IN (SELECT id FROM link_pages WHERE slug = 'phase12creator')`)
    .get() as any;
  assert.strictEqual(afterResave.id, blockId, "the block id is preserved across saves");
  assert.strictEqual(Number(afterResave.click_count), 1, "click history survives a save");
  console.log("   ✓ Worker-origin URL, counted click, stable block id.");

  // ════════════════════════════════════════════════════════════════
  // 7. Agency enquiries are not purged after 7 days
  // ════════════════════════════════════════════════════════════════
  console.log("\n[7] Agency enquiries survive the retention purge...");
  const enquiry = await req("/api/agency/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "agency@phase12.test", accountCount: 9, notes: "14 pages" }),
  });
  assert.strictEqual(enquiry.status, 200);
  sqlite
    .prepare(`UPDATE agency_enquiries SET created_at = ? WHERE email = 'agency@phase12.test'`)
    .run(now - 30 * 86400);

  await purgeRetentionData(mockDb);
  const survived = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM agency_enquiries WHERE email = 'agency@phase12.test'`)
    .get() as any;
  assert.strictEqual(Number(survived.n), 1, "a 30-day-old sales lead must still exist");
  console.log("   ✓ Enquiries live in their own table, outside the purge.");

  console.log("\n🎉 ALL PHASE 12 REGRESSION TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("\n✗ PHASE 12 TESTS FAILED");
  console.error(err);
  process.exit(1);
});
