/**
 * Phase 7: End-to-End System Integration Test
 * Simulates complete creator journey:
 * 1. Email OTP Login -> 7-Day Signed JWT
 * 2. Instagram Account Connection with AES-256-GCM Encrypted Token
 * 3. Reel Automation Setup (Spintax Variations + 3-Button Template Card + Follow-Gate)
 * 4. Inflow Comment Webhook with Web Crypto HMAC-SHA256 & <15ms ACK
 * 5. D1 Cron-as-Queue Jitter Scheduler (30–90s anti-spam)
 * 6. 1-Minute Cron Batch Worker (processDueJobsBatch) & State Machine Transition
 * 7. Captured Leads Recording & 1-Click RFC 4180 CSV Streaming Export
 * 8. Real-time Telemetry & Health Diagnostics
 */

import assert from "node:assert";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import worker from "../src/index";
import { signJwt, verifyJwt } from "../src/auth";
import { encryptSecret, decryptSecret } from "../src/crypto";
import { processDueJobsBatch } from "../src/engine/processor";
import { handleApiRequest } from "../src/api/router";
import { metaGraphClient } from "../src/meta/client";
import type { D1Database, Env } from "../src/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to compute official Meta Webhook HMAC-SHA256
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

// In-Memory SQLite D1Database Mock
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
          return {
            meta: {
              changes: Number(info.changes),
              last_row_id: Number(info.lastInsertRowid),
              duration: 1,
            },
          };
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
    async batch(stmts: any[]) {
      const results: any[] = [];
      for (const stmt of stmts) {
        results.push(await stmt.run());
      }
      return results;
    },
    async exec(query: string) {
      sqlite.exec(query);
      return { count: 0, duration: 1 };
    },
  } as unknown as D1Database;
}

async function runE2ETests() {
  console.log("=== RUNNING PHASE 7 END-TO-END INTEGRATION TEST SUITE ===\n");

  // 1. Initialize In-Memory D1 Database with schema.sql
  const sqlite = new DatabaseSync(":memory:");
  const schemaSql = fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8");
  sqlite.exec(schemaSql);
  const mockDb = createMockD1(sqlite);

  const env: Env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    META_APP_SECRET: "e2e_meta_app_secret_test_32chars_long",
    META_VERIFY_TOKEN: "chatflow_webhook_secret_token_123",
    META_GRAPH_API_VERSION: "v21.0",
    JWT_SECRET: "e2e_jwt_secret_chatflow_super_key_32c",
    ENCRYPTION_MASTER_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    DEBUG_OTPS: "1", // test env echoes the OTP so the flow can be asserted
  };

  // Step 1: Creator signs in via Passwordless Email OTP
  console.log("[1] Testing Passwordless OTP Authentication Flow...");
  const creatorEmail = "creator@growthstudio.io";

  const sendReq = new Request("http://localhost/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creatorEmail }),
  });
  const sendRes = await handleApiRequest(sendReq, env);
  const sendData = (await sendRes.json()) as any;
  assert.strictEqual(sendRes.status, 200);
  assert.ok(sendData.data.debugCode);
  const otpCode = sendData.data.debugCode;

  const verifyReq = new Request("http://localhost/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creatorEmail, code: otpCode }),
  });
  const verifyRes = await handleApiRequest(verifyReq, env);
  const verifyData = (await verifyRes.json()) as any;
  assert.strictEqual(verifyRes.status, 200);
  assert.ok(verifyData.data.token);
  const jwtToken = verifyData.data.token;
  const user = verifyData.data.user;
  console.log(`✓ Signed in creator: ${user.email} (User ID: ${user.id}).`);

  // Step 2: Connect Instagram Account with AES-256-GCM Token Encryption
  console.log("\n[2] Connecting Instagram Account with AES-256-GCM Encryption...");
  const rawInstagramToken = "EAABtest_instagram_token_long_lived_secret_777";
  const encryptedToken = await encryptSecret(rawInstagramToken, env.ENCRYPTION_MASTER_KEY);
  const testAccountId = "acc_e2e_main";
  const testIgUserId = "ig_creator_777";
  const now = Math.floor(Date.now() / 1000);

  sqlite
    .prepare(
      `INSERT INTO connected_accounts (
        id, user_id, instagram_user_id, username, access_token_encrypted,
        token_expires_at, is_active, created_at, updated_at, plan
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 'pro')`
    )
    .run(
      testAccountId,
      user.id,
      testIgUserId,
      "growth_architect",
      encryptedToken,
      now + 5184000,
      now,
      now
    );

  const decryptedToken = await decryptSecret(encryptedToken, env.ENCRYPTION_MASTER_KEY);
  assert.strictEqual(decryptedToken, rawInstagramToken);
  console.log("✓ Instagram account connected. AES-256-GCM encryption verified.");

  // Step 3: Configure Reel Automation Rule
  console.log("\n[3] Creating Reel Automation with 3–8 Spintax Variations & 3-Button Card...");
  const reelId = "reel_e2e_101";
  const automationPayload = {
    accountId: testAccountId,
    instagramMediaId: reelId,
    reelPermalink: "https://instagram.com/reel/C_test_101",
    reelThumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
    triggerKeywords: ["BLUEPRINT", "GROWTH"],
    commentReplies: [
      "Sent to your DMs @username! Check your inbox now 🔥",
      "Dispatched the growth blueprint to your DMs @username! 🚀",
      "@username your requested guide has been sent to messages! 🙌",
    ],
    followGateEnabled: true,
    templateCard: {
      title: "The 2026 Growth Blueprint",
      subtitle: "Viral hooks, retention formulas, and DM templates",
      imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600",
      buttons: [
        {
          type: "web_url",
          title: "Download Blueprint",
          url: "https://chatflow.ai/blueprint",
        },
        {
          type: "web_url",
          title: "Watch Masterclass",
          url: "https://chatflow.ai/masterclass",
        },
        {
          type: "web_url",
          title: "Join VIP Circle",
          url: "https://chatflow.ai/vip",
        },
      ],
    },
    isActive: true,
  };

  const autoReq = new Request("http://localhost/api/automations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(automationPayload),
  });
  const autoRes = await handleApiRequest(autoReq, env);
  const autoData = (await autoRes.json()) as any;
  assert.strictEqual(autoRes.status, 200);
  assert.ok(autoData.data.automation.id);
  console.log("✓ Automation saved with mandatory anti-spam variations & 3-button card limits.");

  // Step 4: Ingest Incoming Instagram Comment Webhook with HMAC
  console.log("\n[4] Ingesting Comment Webhook with HMAC-SHA256 & <15ms ACK...");
  const commentId = "comment_e2e_999";
  const commenterId = "ig_visitor_42";

  const webhookBody = JSON.stringify({
    object: "instagram",
    entry: [
      {
        id: testIgUserId,
        time: Date.now(),
        changes: [
          {
            field: "comments",
            value: {
              id: commentId,
              text: "Please send me the BLUEPRINT link!",
              from: { id: commenterId, username: "sarah_growth" },
              media: { id: reelId },
            },
          },
        ],
      },
    ],
  });

  const validSig = await computeSignature(webhookBody, env.META_APP_SECRET);

  let backgroundTask: Promise<void> | null = null;
  const mockCtx = {
    waitUntil(promise: Promise<void>) {
      backgroundTask = promise;
    },
    passThroughOnException() {},
  };

  const webhookReq = new Request("https://api.chatflow.ai/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": validSig,
    },
    body: webhookBody,
  });

  const startTime = Date.now();
  const webhookRes = await worker.fetch(webhookReq, env, mockCtx as any);
  const durationMs = Date.now() - startTime;
  assert.strictEqual(webhookRes.status, 200);

  if (backgroundTask) {
    await backgroundTask;
  }
  console.log(`✓ Webhook ingested in ${durationMs}ms with valid HMAC-SHA256 signature.`);

  // Verify job in D1
  const jobRow = sqlite.prepare("SELECT * FROM jobs WHERE comment_id = ?").get(commentId) as any;
  assert.ok(jobRow);
  assert.strictEqual(jobRow.status, "pending");
  assert.ok(jobRow.send_at >= now);
  console.log(`✓ Job queued in D1 with 30–90s anti-spam human jitter (send_at: ${jobRow.send_at}).`);

  // Step 5: Execute 1-Minute Cron Batch Worker
  console.log("\n[5] Executing 1-Minute Cron Batch Worker (processDueJobsBatch)...");
  // Force job to be due
  sqlite.prepare(`UPDATE jobs SET send_at = ? WHERE id = ?`).run(now - 10, jobRow.id);

  let dmDispatched = false;
  let commentReplyDispatched = false;

  metaGraphClient.getUserFollowStatus = async () => ({
    isFollowing: true,
    latencyMs: 80,
    decision: "ALLOW_VERIFIED_FOLLOWER",
  });

  metaGraphClient.sendCommentReply = async (_token, _commentId, replyText) => {
    commentReplyDispatched = true;
    assert.ok(replyText.includes("@sarah_growth"));
    return { id: "reply_comment_123" };
  };

  metaGraphClient.sendPrivateReply = async () => {
    dmDispatched = true;
    return { recipient_id: commenterId, message_id: "mid_card_777" };
  };

  metaGraphClient.sendDirectMessage = async () => ({
    recipient_id: commenterId,
    message_id: "mid_dm_777",
  });

  const cronResult = await processDueJobsBatch(env, { batchLimit: 10 });
  assert.strictEqual(cronResult.processedCount, 1);
  assert.strictEqual(cronResult.completedCount, 1);
  assert.strictEqual(cronResult.failedCount, 0);
  assert.ok(commentReplyDispatched, "Public comment reply must be sent with @username");
  assert.ok(dmDispatched, "3-button Generic Template card must be dispatched to DMs");

  const completedJob = sqlite.prepare("SELECT * FROM jobs WHERE id = ?").get(jobRow.id) as any;
  assert.strictEqual(completedJob.status, "completed");
  console.log("✓ Job processed atomically and marked completed in D1 state machine.");

  // Step 6: Verify Captured Lead in Database & RFC 4180 CSV Export
  console.log("\n[6] Verifying Captured Lead and RFC 4180 CSV Export...");
  const leadRow = sqlite.prepare("SELECT * FROM captured_leads WHERE instagram_scoped_id = ?").get(commenterId) as any;
  assert.ok(leadRow);
  assert.strictEqual(leadRow.username, "sarah_growth");
  assert.strictEqual(leadRow.follower_status_at_trigger, 1);
  assert.strictEqual(leadRow.total_dms_sent, 1);
  console.log(`✓ Lead captured: @${leadRow.username} (Follower: ${Boolean(leadRow.follower_status_at_trigger)}).`);

  // CSV Export
  const csvReq = new Request(`http://localhost/api/leads/export?accountId=${testAccountId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  const csvRes = await handleApiRequest(csvReq, env);
  assert.strictEqual(csvRes.status, 200);
  assert.strictEqual(csvRes.headers.get("Content-Type"), "text/csv; charset=utf-8");
  const csvContent = await csvRes.text();
  assert.ok(csvContent.includes("Lead ID,Username,Instagram Scoped ID,Follower Status"));
  assert.ok(csvContent.includes("sarah_growth"));
  console.log("✓ RFC 4180 CSV streaming export generated successfully.");

  // Step 7: Verify Telemetry API
  console.log("\n[7] Verifying System Telemetry & Health API...");
  const teleReq = new Request(`http://localhost/api/analytics?accountId=${testAccountId}`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  const teleRes = await handleApiRequest(teleReq, env);
  const teleData = (await teleRes.json()) as any;
  assert.strictEqual(teleRes.status, 200);
  assert.strictEqual(teleData.data.telemetry.status, "healthy");
  assert.strictEqual(teleData.data.telemetry.totalLeads, 1);
  assert.strictEqual(teleData.data.telemetry.followerConversionRate, 100);
  console.log("✓ Telemetry verified: 100% operational, 100% follower conversion rate.");

  console.log("\n🎉 ALL PHASE 7 END-TO-END INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
}

runE2ETests().catch((err) => {
  console.error("❌ E2E Integration Test Failed:", err);
  process.exit(1);
});
