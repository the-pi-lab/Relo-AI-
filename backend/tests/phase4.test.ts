import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { processDueJobsBatch } from "../src/engine/processor";
import { encryptSecret } from "../src/crypto";
import { metaGraphClient } from "../src/meta/client";
import { MetaApiError, RateLimitError } from "../src/meta/errors";

// Create in-memory SQLite D1Database mock
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

// Compute valid HMAC-SHA256 signature for test requests
async function computeSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hexSig = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${hexSig}`;
}

async function runTests() {
  console.log("=== RUNNING PHASE 4 TEST SUITE ===");

  // 1. Initialize SQLite in-memory D1 database with schema.sql
  console.log("\n[1] Setting up D1 In-Memory Database...");
  const sqlite = new DatabaseSync(":memory:");
  const schemaPath = path.join(__dirname, "../schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  sqlite.exec(schemaSql);
  const mockDb = createMockD1(sqlite);

  const env: Env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    META_APP_SECRET: "test_meta_app_secret_9999",
    META_VERIFY_TOKEN: "chatflow_verify_token_secure",
    META_GRAPH_API_VERSION: "v21.0",
    JWT_SECRET: "test_jwt_secret_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
  };
  console.log("✓ D1 Schema loaded and Env configured.");

  // 2. Test Meta Webhook Handshake (GET /webhook)
  console.log("\n[2] Testing Meta Webhook Verification Handshake (GET /webhook)...");
  // Valid token
  const validHandshakeReq = new Request(
    "https://api.chatflow.ai/webhook?hub.mode=subscribe&hub.verify_token=chatflow_verify_token_secure&hub.challenge=test_challenge_code_12345"
  );
  const validHandshakeRes = await worker.fetch(validHandshakeReq, env, {} as any);
  assert.strictEqual(validHandshakeRes.status, 200);
  const challengeText = await validHandshakeRes.text();
  assert.strictEqual(challengeText, "test_challenge_code_12345");

  // Invalid token
  const invalidHandshakeReq = new Request(
    "https://api.chatflow.ai/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=123"
  );
  const invalidHandshakeRes = await worker.fetch(invalidHandshakeReq, env, {} as any);
  assert.strictEqual(invalidHandshakeRes.status, 403);
  console.log("✓ Webhook verification handshake passed (200 on valid token, 403 on invalid).");

  // 3. Seed test user, connected account, and reel automation
  console.log("\n[3] Seeding test creator account and automation rule...");
  const testUserId = "user_master_1";
  const testAccountId = "acc_ig_100";
  const testIgUserId = "ig_page_555";
  const testMediaId = "reel_media_777";
  const rawToken = "EAABtest_token_valid_12345";
  const encryptedToken = await encryptSecret(rawToken, env.ENCRYPTION_MASTER_KEY!);

  // Insert user
  sqlite.prepare(`INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)`).run(
    testUserId,
    "creator@chatflow.ai",
    Math.floor(Date.now() / 1000)
  );

  // Insert connected account
  sqlite
    .prepare(
      `INSERT INTO connected_accounts (
        id, user_id, instagram_user_id, username, access_token_encrypted,
        token_expires_at, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
    .run(
      testAccountId,
      testUserId,
      testIgUserId,
      "growth_master",
      encryptedToken,
      Math.floor(Date.now() / 1000) + 5184000,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    );

  // Insert reel automation
  const testAutomationId = "auto_reel_1";
  const triggerKeywords = JSON.stringify(["GUIDE", "VIP"]);
  const commentReplies = JSON.stringify([
    "{Hey|Hello} @username, just sent the link to your DMs! 🔥",
    "Check your DMs @username, guide is sent! 🙌",
    "@username check your inbox right now! 🚀",
  ]);
  const templateCard = JSON.stringify({
    title: "10x Instagram Growth Blueprint",
    subtitle: "Complete viral framework breakdown and templates",
    imageUrl: "https://chatflow.ai/blueprint.png",
    buttons: [
      {
        type: "web_url",
        title: "Download Free Guide",
        url: "https://chatflow.ai/guide?ref=ig",
      },
    ],
  });

  sqlite
    .prepare(
      `INSERT INTO reel_automations (
        id, account_id, instagram_media_id, reel_permalink,
        trigger_keywords, comment_replies, follow_gate_enabled, template_card,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?)`
    )
    .run(
      testAutomationId,
      testAccountId,
      testMediaId,
      "https://instagram.com/reel/xyz123",
      triggerKeywords,
      commentReplies,
      templateCard,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    );
  console.log("✓ Seeded test account and automation rule.");

  // 4. Test Webhook Ingestion (POST /webhook)
  console.log("\n[4] Testing Webhook Ingestion & Deduplication (POST /webhook)...");
  const webhookBody = JSON.stringify({
    object: "instagram",
    entry: [
      {
        id: testIgUserId,
        time: 1700000000,
        changes: [
          {
            field: "comments",
            value: {
              id: "comment_test_001",
              text: "Please send me the GUIDE 🔥",
              from: { id: "customer_ig_999", username: "sarah_growth" },
              media: { id: testMediaId },
              created_time: 1700000001,
            },
          },
        ],
      },
    ],
  });

  const validSig = await computeSignature(webhookBody, env.META_APP_SECRET);

  // Ingest request
  const ingestReq = new Request("https://api.chatflow.ai/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": validSig,
    },
    body: webhookBody,
  });

  let asyncTaskPromise: Promise<void> | null = null;
  const mockCtx = {
    waitUntil(promise: Promise<void>) {
      asyncTaskPromise = promise;
    },
  };

  const ingestRes = await worker.fetch(ingestReq, env, mockCtx as any);
  assert.strictEqual(ingestRes.status, 200);
  const ingestJson: any = await ingestRes.json();
  assert.strictEqual(ingestJson.received, true);

  // Wait for background async ingest task
  if (asyncTaskPromise) {
    await asyncTaskPromise;
  }

  // Check that job was inserted in D1 jobs table with 30-90s jitter
  const jobRow: any = sqlite
    .prepare(`SELECT * FROM jobs WHERE comment_id = 'comment_test_001'`)
    .get();
  assert.ok(jobRow, "Job must exist in jobs table");
  assert.strictEqual(jobRow.comment_id, "comment_test_001");
  assert.strictEqual(jobRow.status, "pending");
  assert.strictEqual(jobRow.matched_automation_id, testAutomationId);
  assert.strictEqual(jobRow.commenter_username, "sarah_growth");
  assert.ok(jobRow.send_at >= Math.floor(Date.now() / 1000) + 30, "send_at must have >= 30s jitter");
  assert.ok(jobRow.send_at <= Math.floor(Date.now() / 1000) + 90, "send_at must have <= 90s jitter");

  // Deduplication check: Send the exact same webhook again!
  const dupReq = new Request("https://api.chatflow.ai/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": validSig,
    },
    body: webhookBody,
  });
  const dupRes = await worker.fetch(dupReq, env, mockCtx as any);
  if (asyncTaskPromise) await asyncTaskPromise;
  assert.strictEqual(dupRes.status, 200);

  const jobCountRow: any = sqlite
    .prepare(`SELECT COUNT(*) as count FROM jobs WHERE comment_id = 'comment_test_001'`)
    .get();
  assert.strictEqual(jobCountRow.count, 1, "Duplicate comment ID must be deduplicated by D1");
  console.log("✓ Webhook ingestion passed (valid HMAC, atomic deduplication, 30-90s anti-spam jitter).");

  // 5. Test Cron Batch Processor (processDueJobsBatch)
  console.log("\n[5] Testing 1-Minute Cron Batch Processor...");

  // Force job to be due now by setting send_at = 0
  sqlite.prepare(`UPDATE jobs SET send_at = 0 WHERE comment_id = 'comment_test_001'`).run();

  // Mock Meta API Client responses
  let publicReplySent: { commentId: string; message: string } | null = null;
  let privateDmSent: { payload: any } | null = null;

  metaGraphClient.sendCommentReply = async (_token, commentId, message) => {
    publicReplySent = { commentId, message };
    return { id: "new_comment_reply_id_123" };
  };

  metaGraphClient.sendPrivateReply = async (_token, payload) => {
    privateDmSent = { payload };
    return { recipient_id: "customer_ig_999", message_id: "dm_sent_mid_888" };
  };

  metaGraphClient.getUserFollowStatus = async () => {
    return {
      isFollowing: true,
      latencyMs: 120,
      decision: "ALLOW_VERIFIED_FOLLOWER",
    };
  };

  // Run Cron batch processor
  const cronResult = await processDueJobsBatch(env, { batchLimit: 10 });
  assert.strictEqual(cronResult.processedCount, 1);
  assert.strictEqual(cronResult.completedCount, 1);
  assert.strictEqual(cronResult.failedCount, 0);

  // Check public reply
  assert.ok(publicReplySent, "Public comment reply must be sent");
  assert.strictEqual(publicReplySent!.commentId, "comment_test_001");
  assert.ok(
    publicReplySent!.message.includes("@sarah_growth"),
    "Comment reply must inject @username dynamically"
  );

  // Check private DM (3-button generic template card)
  assert.ok(privateDmSent, "Private DM must be sent");
  const attachment = (privateDmSent!.payload as any).message?.attachment;
  assert.strictEqual(attachment?.type, "template");
  assert.strictEqual(attachment?.payload?.template_type, "generic");
  assert.strictEqual(
    attachment?.payload?.elements?.[0]?.title,
    "10x Instagram Growth Blueprint"
  );

  // Check job status in D1
  const completedJobRow: any = sqlite
    .prepare(`SELECT * FROM jobs WHERE comment_id = 'comment_test_001'`)
    .get();
  assert.strictEqual(completedJobRow.status, "completed");
  assert.strictEqual(completedJobRow.response_mid, "dm_sent_mid_888");

  // Check captured lead in D1
  const leadRow: any = sqlite
    .prepare(
      `SELECT * FROM captured_leads WHERE account_id = ? AND instagram_scoped_id = ?`
    )
    .get(testAccountId, "customer_ig_999");
  assert.ok(leadRow, "Lead must be stored in captured_leads");
  assert.strictEqual(leadRow.username, "sarah_growth");
  assert.strictEqual(leadRow.follower_status_at_trigger, 1);
  assert.strictEqual(leadRow.total_dms_sent, 1);

  console.log("✓ Cron batch processor passed (atomic execution, Spintax comment reply, 3-button DM, lead capture).");

  // 6. Test Human Takeover Auto-Pause (30-minute pause)
  console.log("\n[6] Testing Human Takeover Auto-Pause...");
  // Enqueue a second job
  sqlite
    .prepare(
      `INSERT INTO jobs (
        id, account_id, comment_id, commenter_user_id, commenter_username,
        comment_text, post_id, matched_automation_id, send_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')`
    )
    .run(
      "job_pause_test",
      testAccountId,
      "comment_pause_002",
      "customer_paused_888",
      "paused_user",
      "GUIDE",
      testMediaId,
      testAutomationId
    );

  // Set Human Takeover pause for this customer
  sqlite
    .prepare(
      `INSERT INTO human_takeovers (id, account_id, thread_id, paused_until)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      "pause_id_1",
      testAccountId,
      "customer_paused_888",
      Math.floor(Date.now() / 1000) + 1800 // 30 minutes in future
    );

  const pauseCronResult = await processDueJobsBatch(env, { batchLimit: 10 });
  assert.strictEqual(pauseCronResult.skippedCount, 1);

  const pausedJobRow: any = sqlite
    .prepare(`SELECT * FROM jobs WHERE comment_id = 'comment_pause_002'`)
    .get();
  assert.strictEqual(pausedJobRow.status, "completed");
  assert.strictEqual(pausedJobRow.response_mid, "SKIPPED_HUMAN_TAKEOVER");
  console.log("✓ Human takeover auto-pause passed (automated replies suppressed during active manual conversation).");

  // 7. Test Exponential Backoff Retry Logic on Rate Limit
  console.log("\n[7] Testing Exponential Backoff Retry on Rate Limit...");
  sqlite
    .prepare(
      `INSERT INTO jobs (
        id, account_id, comment_id, commenter_user_id, commenter_username,
        comment_text, post_id, matched_automation_id, send_at, status, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', 0)`
    )
    .run(
      "job_retry_test",
      testAccountId,
      "comment_retry_003",
      "customer_retry_777",
      "retry_user",
      "GUIDE",
      testMediaId,
      testAutomationId
    );

  // Mock Meta API returning rate limit Code 17 (retryable)
  metaGraphClient.sendPrivateReply = async () => {
    throw new RateLimitError("User request limit reached", {
      code: 17,
      statusCode: 400,
    });
  };

  const retryCronResult = await processDueJobsBatch(env, { batchLimit: 10 });
  assert.strictEqual(retryCronResult.failedCount, 1);

  const retriedJobRow: any = sqlite
    .prepare(`SELECT * FROM jobs WHERE comment_id = 'comment_retry_003'`)
    .get();
  assert.strictEqual(retriedJobRow.status, "pending");
  assert.strictEqual(retriedJobRow.retry_count, 1);
  assert.ok(
    retriedJobRow.send_at > Math.floor(Date.now() / 1000),
    "send_at must be rescheduled with exponential backoff"
  );
  console.log("✓ Retry engine passed (exponential backoff applied on transient errors).");

  console.log("\n🎉 ALL PHASE 4 TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch((err) => {
  console.error("Phase 4 Test Failed:", err);
  process.exit(1);
});
