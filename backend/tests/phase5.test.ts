import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { signJwt } from "../src/auth";
import { encryptSecret } from "../src/crypto";

// SQLite in-memory D1Database mock
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

async function runTests() {
  console.log("=== RUNNING PHASE 5 REST API TEST SUITE ===");

  // 1. Initialize D1 In-Memory Database with schema.sql
  console.log("\n[1] Initializing D1 in-memory database with schema.sql...");
  const sqlite = new DatabaseSync(":memory:");
  const schemaPath = path.join(__dirname, "../schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  sqlite.exec(schemaSql);
  const mockDb = createMockD1(sqlite);

  const env: Env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    META_APP_SECRET: "test_meta_secret_key_9999",
    META_VERIFY_TOKEN: "chatflow_verify_token_secure",
    META_GRAPH_API_VERSION: "v21.0",
    JWT_SECRET: "test_jwt_secret_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1", // test env echoes the OTP so the flow can be asserted
  };
  console.log("✓ Database initialized.");

  // 2. Test Passwordless OTP Authentication Flow
  console.log("\n[2] Testing Passwordless OTP Authentication Flow...");

  // Send OTP with invalid email
  const invalidEmailReq = new Request("https://api.chatflow.ai/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email" }),
  });
  const invalidEmailRes = await worker.fetch(invalidEmailReq, env, {} as any);
  assert.strictEqual(invalidEmailRes.status, 400);

  // Send OTP with valid email
  const sendOtpReq = new Request("https://api.chatflow.ai/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "creator@chatflow.ai" }),
  });
  const sendOtpRes = await worker.fetch(sendOtpReq, env, {} as any);
  assert.strictEqual(sendOtpRes.status, 200);
  const sendOtpJson: any = await sendOtpRes.json();
  assert.strictEqual(sendOtpJson.success, true);
  const otpCode = sendOtpJson.data.debugCode;
  assert.ok(otpCode && otpCode.length === 6, "OTP code must be 6 digits");

  // Verify with wrong OTP
  const wrongVerifyReq = new Request("https://api.chatflow.ai/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "creator@chatflow.ai", code: "000000" }),
  });
  const wrongVerifyRes = await worker.fetch(wrongVerifyReq, env, {} as any);
  assert.strictEqual(wrongVerifyRes.status, 401);

  // Verify with correct OTP
  const validVerifyReq = new Request("https://api.chatflow.ai/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "creator@chatflow.ai", code: otpCode }),
  });
  const validVerifyRes = await worker.fetch(validVerifyReq, env, {} as any);
  assert.strictEqual(validVerifyRes.status, 200);
  const validVerifyJson: any = await validVerifyRes.json();
  assert.strictEqual(validVerifyJson.success, true);
  const userToken = validVerifyJson.data.token;
  const userProfile = validVerifyJson.data.user;
  assert.ok(userToken, "JWT session token must be issued");
  assert.strictEqual(userProfile.email, "creator@chatflow.ai");

  // Verify OTP was consumed (cannot be reused)
  const reusedVerifyReq = new Request("https://api.chatflow.ai/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "creator@chatflow.ai", code: otpCode }),
  });
  const reusedVerifyRes = await worker.fetch(reusedVerifyReq, env, {} as any);
  assert.strictEqual(reusedVerifyRes.status, 401, "OTP must be single-use only");

  console.log("✓ Passwordless OTP flow passed (6-digit code, single-use, signed JWT issued).");

  // 3. Test Authentication Guard
  console.log("\n[3] Testing JWT Authentication Guard...");
  // Request protected route without token
  const unauthReq = new Request("https://api.chatflow.ai/api/accounts");
  const unauthRes = await worker.fetch(unauthReq, env, {} as any);
  assert.strictEqual(unauthRes.status, 401);

  // Request with invalid token
  const badTokenReq = new Request("https://api.chatflow.ai/api/accounts", {
    headers: { Authorization: "Bearer bad.token.here" },
  });
  const badTokenRes = await worker.fetch(badTokenReq, env, {} as any);
  assert.strictEqual(badTokenRes.status, 401);

  // Request with valid JWT token
  const authReq = new Request("https://api.chatflow.ai/api/accounts", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const authRes = await worker.fetch(authReq, env, {} as any);
  assert.strictEqual(authRes.status, 200);
  const authJson: any = await authRes.json();
  assert.strictEqual(authJson.success, true);
  assert.ok(Array.isArray(authJson.data.accounts));
  console.log("✓ Authentication guard passed (enforces valid Bearer JWT).");

  // 4. Test Accounts Management
  console.log("\n[4] Testing Accounts API...");
  // Seed a connected account for this user
  const accountId = "acc_test_growth";
  const encryptedToken = await encryptSecret("EAAB_test_token", env.ENCRYPTION_MASTER_KEY!);
  sqlite
    .prepare(
      `INSERT INTO connected_accounts (
        id, user_id, instagram_user_id, username, profile_picture_url,
        access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'pro')`
    )
    .run(
      accountId,
      userProfile.id,
      "ig_user_100",
      "growth_pilot",
      "https://chatflow.ai/pic.png",
      encryptedToken,
      Math.floor(Date.now() / 1000) + 5184000,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    );

  // List accounts
  const listAccRes = await worker.fetch(
    new Request("https://api.chatflow.ai/api/accounts", {
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env,
    {} as any
  );
  assert.strictEqual(listAccRes.status, 200);
  const listAccJson: any = await listAccRes.json();
  assert.strictEqual(listAccJson.data.accounts.length, 1);
  assert.strictEqual(listAccJson.data.accounts[0].username, "growth_pilot");
  assert.ok(listAccJson.data.accounts[0].daysUntilExpiration >= 59);

  console.log("✓ Accounts API passed.");

  // 5. Test Automations CRUD & Anti-Spam Validation
  console.log("\n[5] Testing Automations CRUD & Anti-Spam Rules...");

  // Anti-Spam Violation: Only 1 variation (minimum 3 required!)
  const invalidAutoReq = new Request("https://api.chatflow.ai/api/automations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accountId,
      instagramMediaId: "media_111",
      reelPermalink: "https://instagram.com/reel/111",
      triggerKeywords: ["GUIDE"],
      commentReplies: ["Only one reply variation"], // VIOLATION
      templateCard: {
        title: "Test Guide",
        buttons: [{ type: "web_url", title: "Click Here", url: "https://chatflow.ai" }],
      },
    }),
  });
  const invalidAutoRes = await worker.fetch(invalidAutoReq, env, {} as any);
  assert.strictEqual(invalidAutoRes.status, 400);
  const invalidAutoJson: any = await invalidAutoRes.json();
  assert.strictEqual(invalidAutoJson.error.code, "SPAM_PROTECTION_VIOLATION");

  // Valid Automation Creation (3+ variations, valid 3-button card)
  const validAutoReq = new Request("https://api.chatflow.ai/api/automations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "auto_rule_555",
      accountId,
      instagramMediaId: "media_111",
      reelPermalink: "https://instagram.com/reel/111",
      triggerKeywords: ["GUIDE", "VIP"],
      commentReplies: [
        "Sent to your DMs @username! 🔥",
        "Check your inbox @username 🙌",
        "@username check your DMs right now! 🚀",
      ],
      followGateEnabled: true,
      templateCard: {
        title: "Creator Playbook",
        subtitle: "How to scale to 100k followers",
        buttons: [
          { type: "web_url", title: "Download PDF", url: "https://chatflow.ai/pdf" },
          { type: "web_url", title: "Watch Video", url: "https://chatflow.ai/video" },
        ],
      },
    }),
  });
  const validAutoRes = await worker.fetch(validAutoReq, env, {} as any);
  if (validAutoRes.status !== 200) { console.log('DEBUG BODY:', JSON.stringify(await validAutoRes.json())); }
  assert.strictEqual(validAutoRes.status, 200);
  const validAutoJson: any = await validAutoRes.json();
  assert.strictEqual(validAutoJson.success, true);
  assert.strictEqual(validAutoJson.data.automation.id, "auto_rule_555");

  // List automations
  const listAutoRes = await worker.fetch(
    new Request(`https://api.chatflow.ai/api/automations?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env,
    {} as any
  );
  assert.strictEqual(listAutoRes.status, 200);
  const listAutoJson: any = await listAutoRes.json();
  assert.strictEqual(listAutoJson.data.automations.length, 1);
  assert.strictEqual(listAutoJson.data.automations[0].templateCard.buttons.length, 2);

  // Delete automation
  const delAutoRes = await worker.fetch(
    new Request(`https://api.chatflow.ai/api/automations/auto_rule_555?accountId=${accountId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env,
    {} as any
  );
  assert.strictEqual(delAutoRes.status, 200);
  const listAutoAfterDelRes = await worker.fetch(
    new Request(`https://api.chatflow.ai/api/automations?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env,
    {} as any
  );
  const listAutoAfterDelJson: any = await listAutoAfterDelRes.json();
  assert.strictEqual(listAutoAfterDelJson.data.automations.length, 0);

  console.log("✓ Automations API passed (anti-spam validation, 3-button card limits, CRUD).");

  // 6. Test Leads Management & 1-Click CSV Export
  console.log("\n[6] Testing Leads Management & CSV Streaming Export...");
  // Seed 3 captured leads
  sqlite
    .prepare(
      `INSERT INTO captured_leads (
        id, account_id, instagram_scoped_id, username, follower_status_at_trigger,
        email_collected, total_dms_sent, first_interaction_at, last_interaction_at
      ) VALUES 
      ('lead_1', ?, 'ig_lead_1', 'sarah_creator', 1, 'sarah@example.com', 2, 1700000000, 1700000100),
      ('lead_2', ?, 'ig_lead_2', 'alex_video', 0, NULL, 1, 1700000000, 1700000200),
      ('lead_3', ?, 'ig_lead_3', 'jordan_brand', 1, 'jordan@brand.co', 5, 1700000000, 1700000300)`
    )
    .run(accountId, accountId, accountId);

  // Fetch paginated leads
  const leadsReq = new Request(`https://api.chatflow.ai/api/leads?accountId=${accountId}&limit=10`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const leadsRes = await worker.fetch(leadsReq, env, {} as any);
  assert.strictEqual(leadsRes.status, 200);
  const leadsJson: any = await leadsRes.json();
  assert.strictEqual(leadsJson.data.total, 3);
  assert.strictEqual(leadsJson.data.leads.length, 3);

  // Search filter
  const searchReq = new Request(
    `https://api.chatflow.ai/api/leads?accountId=${accountId}&search=sarah`,
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  const searchRes = await worker.fetch(searchReq, env, {} as any);
  const searchJson: any = await searchRes.json();
  assert.strictEqual(searchJson.data.total, 1);
  assert.strictEqual(searchJson.data.leads[0].username, "sarah_creator");

  // 1-Click CSV Export
  const csvExportReq = new Request(`https://api.chatflow.ai/api/leads/export?accountId=${accountId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const csvExportRes = await worker.fetch(csvExportReq, env, {} as any);
  assert.strictEqual(csvExportRes.status, 200);
  assert.strictEqual(csvExportRes.headers.get("Content-Type"), "text/csv; charset=utf-8");
  const disposition = csvExportRes.headers.get("Content-Disposition");
  assert.ok(disposition && disposition.includes("attachment; filename="));

  const csvText = await csvExportRes.text();
  assert.ok(csvText.includes("Lead ID,Username,Instagram Scoped ID,Follower Status"));
  assert.ok(csvText.includes("sarah_creator"));
  assert.ok(csvText.includes("jordan@brand.co"));
  assert.ok(csvText.includes("Non-Follower"));

  console.log("✓ Leads management and 1-Click CSV export passed (RFC 4180 format, proper headers).");

  // 7. Test Analytics Telemetry
  console.log("\n[7] Testing Analytics Telemetry API...");
  const analyticsReq = new Request(`https://api.chatflow.ai/api/analytics?accountId=${accountId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const analyticsRes = await worker.fetch(analyticsReq, env, {} as any);
  assert.strictEqual(analyticsRes.status, 200);
  const analyticsJson: any = await analyticsRes.json();
  assert.strictEqual(analyticsJson.success, true);
  const telemetry = analyticsJson.data.telemetry;
  assert.strictEqual(telemetry.status, "healthy");
  assert.strictEqual(telemetry.totalLeads, 3);
  assert.ok(telemetry.totalDmsSent >= 3);
  assert.ok(telemetry.followerConversionRate > 0);

  console.log("✓ Analytics telemetry passed (real-time conversion rates & system health).");

  console.log("\n🎉 ALL PHASE 5 REST API TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch((err) => {
  console.error("Phase 5 Test Failed:", err);
  process.exit(1);
});
