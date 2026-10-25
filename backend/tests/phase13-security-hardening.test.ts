/**
 * Phase 13 — regression suite for the security hardening pass.
 *
 * Every case here failed (or was impossible to assert) before this suite:
 *   1. login OTPs were stored in plaintext
 *   2. a deployment with no email provider reported "code sent" and then
 *      silently locked the user out
 *   3. every inbound DM set a 30-minute human-takeover pause, which suppressed
 *      the AI reply and blocked the job queue on that thread
 *   4. a redelivered webhook produced a second AI reply
 *   5. the AI answered every message in a burst instead of once per thread
 *   6. an echo of our own DM was indistinguishable from a human takeover
 *   7. token refresh sent a PAGE token to a USER-token-only grant
 *   8. the HUMAN_AGENT tag widened the window even when Meta had not approved it
 *   9. a campaign card could carry content Meta rejects per recipient at send time
 *  10. the mid ledger / AI clock / takeover table grew without bound
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
import { decryptSecret, encryptSecret } from "../src/crypto";
import {
  purgeRetentionData,
  upsertConnectedAccount,
} from "../src/db/queries";
import { refreshExpiringTokens } from "../src/engine/tokenRefresh";
import { metaGraphClient } from "../src/meta/client";

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
  const hex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${hex}`;
}

async function runTests() {
  console.log("=== RUNNING PHASE 13 SECURITY HARDENING SUITE ===");

  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase13_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    META_APP_ID: "meta_app_id_phase13",
    META_APP_SECRET: "meta_app_secret_phase13",
    META_VERIFY_TOKEN: "verify_phase13",
    PUBLIC_BASE_URL: "https://engine.relo.test",
    PUBLIC_APP_URL: "https://app.relo.test",
  } as unknown as Env;

  const now = Math.floor(Date.now() / 1000);

  const req = (p: string, init: RequestInit = {}) =>
    worker.fetch(new Request(`${BASE}${p}`, init), env, {} as any);

  const signUp = async (email: string) => {
    const send = await req("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const sendJson: any = await (send as any).json();
    const verify = await req("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: sendJson.data.debugCode }),
    });
    const json: any = await verify.json();
    return {
      userId: json.data.user.id as string,
      auth: {
        Authorization: `Bearer ${json.data.token}`,
        "Content-Type": "application/json",
      },
    };
  };

  /** Posts a signed messaging webhook and waits for waitUntil to settle. */
  const postMessage = async (entryId: string, messaging: unknown) => {
    const body = JSON.stringify({
      object: "instagram",
      entry: [{ id: entryId, time: now, messaging: [messaging] }],
    });
    let task: Promise<void> | null = null;
    const res = await worker.fetch(
      new Request(`${BASE}/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": await computeSignature(body, env.META_APP_SECRET),
        },
        body,
      }),
      env,
      { waitUntil: (p: Promise<void>) => { task = p; } } as any
    );
    if (task) await task;
    return res;
  };

  // ════════════════════════════════════════════════════════════════
  // 1. OTPs are stored hashed, and still verify
  // ════════════════════════════════════════════════════════════════
  console.log("\n[1] Login OTPs are stored as HMAC digests, never plaintext...");
  const otpEmail = "hashed@phase13.test";
  const sendOtp = await req("/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: otpEmail }),
  });
  assert.strictEqual(sendOtp.status, 200);
  const sendOtpJson: any = await sendOtp.json();
  const otpCode = sendOtpJson.data.debugCode;
  assert.ok(otpCode && otpCode.length === 6, "the dev flow still returns a code");

  const otpRow: any = sqlite
    .prepare(`SELECT code_hash FROM email_otps WHERE email = ?`)
    .get(otpEmail);
  assert.ok(otpRow, "the OTP row exists");
  assert.notStrictEqual(otpRow.code_hash, otpCode, "the code must not be stored in plaintext");
  assert.strictEqual(otpRow.code_hash.length, 64, "HMAC-SHA256 hex is 64 chars");
  assert.ok(!/^\d{6}$/.test(otpRow.code_hash), "the stored value is not a 6-digit code");

  const verifyOtp = await req("/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: otpEmail, code: otpCode }),
  });
  assert.strictEqual(verifyOtp.status, 200, "the hashed OTP still verifies");
  console.log("   ✓ Plaintext absent from D1; verify consumes the digest.");

  // ════════════════════════════════════════════════════════════════
  // 2. A deployment with no email provider fails closed
  // ════════════════════════════════════════════════════════════════
  console.log("\n[2] Missing email configuration fails closed instead of faking success...");
  const noEmailEnv = {
    ...env,
    DEBUG_OTPS: undefined,
    RESEND_API_KEY: undefined,
  } as unknown as Env;
  const noEmailRes = await worker.fetch(
    new Request(`${BASE}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "noreply@phase13.test" }),
    }),
    noEmailEnv,
    {} as any
  );
  assert.strictEqual(noEmailRes.status, 503);
  const noEmailJson: any = await noEmailRes.json();
  assert.strictEqual(noEmailJson.error.code, "EMAIL_NOT_CONFIGURED");
  const noEmailRow = sqlite
    .prepare(`SELECT 1 FROM email_otps WHERE email = ?`)
    .get("noreply@phase13.test");
  assert.strictEqual(noEmailRow, undefined, "no OTP row is written when it cannot be delivered");
  console.log("   ✓ 503 EMAIL_NOT_CONFIGURED, no stored code, no false 'sent'.");

  // ════════════════════════════════════════════════════════════════
  // 3. Inbound DMs are deduped, do not pause the thread, and the AI
  //    answers once per cooldown window
  // ════════════════════════════════════════════════════════════════
  console.log("\n[3] Inbound dedupe + no self-pause + per-thread AI cooldown...");
  const creator = await signUp("creator@phase13.test");
  sqlite.prepare(`UPDATE users SET plan = 'pro', ai_credits_remaining = 500 WHERE id = ?`).run(
    creator.userId
  );

  const aiAccountId = "acc_p13_ai";
  const aiIgId = "ig_p13_ai";
  const leadIg = "lead_p13_ai";
  await upsertConnectedAccount(mockDb, {
    id: aiAccountId,
    userId: creator.userId,
    instagramUserId: aiIgId,
    username: "phase13.creator",
    accessTokenEncrypted: await encryptSecret("EAAB_phase13_token", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now + 5184000,
  });

  const sent: string[] = [];
  const originalSend = metaGraphClient.sendDirectMessage;
  metaGraphClient.sendDirectMessage = async (_token, _recipient, _payload) => {
    const mid = `mid_ai_out_${sent.length + 1}`;
    sent.push(mid);
    return { recipient_id: _recipient, message_id: mid };
  };

  const inbound = (mid: string, text: string) => ({
    sender: { id: leadIg },
    recipient: { id: aiIgId },
    timestamp: now * 1000,
    message: { mid, text },
  });

  await postMessage(aiIgId, inbound("mid_in_1", "hello"));
  assert.strictEqual(sent.length, 1, "the first inbound DM gets one handoff reply");

  const inRows: any[] = sqlite
    .prepare(`SELECT mid, direction FROM message_mids WHERE account_id = ? ORDER BY mid`)
    .all(aiAccountId);
  assert.deepStrictEqual(
    inRows.map((r) => `${r.mid}:${r.direction}`),
    ["mid_ai_out_1:out", "mid_in_1:in"],
    "inbound and outbound mids are both recorded"
  );

  const pauseAfterInbound = sqlite
    .prepare(`SELECT COUNT(*) AS total FROM human_takeovers WHERE account_id = ?`)
    .get(aiAccountId) as any;
  assert.strictEqual(Number(pauseAfterInbound.total), 0, "an inbound DM is not a takeover");

  // Redelivery of the same mid must be a no-op.
  await postMessage(aiIgId, inbound("mid_in_1", "hello"));
  assert.strictEqual(sent.length, 1, "a redelivered webhook cannot double-reply");
  const dedupeRow: any = sqlite
    .prepare(`SELECT COUNT(*) AS total FROM message_mids WHERE mid = 'mid_in_1'`)
    .get();
  assert.strictEqual(Number(dedupeRow.total), 1);

  // A different message inside the cooldown is coalesced.
  await postMessage(aiIgId, inbound("mid_in_2", "is this available?"));
  assert.strictEqual(sent.length, 1, "the per-thread cooldown suppresses a burst reply");

  // Once the cooldown has elapsed, the AI answers again.
  sqlite
    .prepare(`UPDATE ai_thread_state SET last_ai_reply_at = ? WHERE account_id = ?`)
    .run(now - 3600, aiAccountId);
  await postMessage(aiIgId, inbound("mid_in_3", "hello again"));
  assert.strictEqual(sent.length, 2, "the AI resumes after the cooldown");
  console.log("   ✓ Dedupe, no inbound pause, cooldown enforced and released.");

  // ════════════════════════════════════════════════════════════════
  // 4. Only a genuine human echo starts a takeover
  // ════════════════════════════════════════════════════════════════
  console.log("\n[4] Our own echo is ignored; a human echo pauses the thread...");
  const ourEcho = {
    sender: { id: aiIgId },
    recipient: { id: leadIg },
    timestamp: now * 1000,
    message: { mid: "mid_ai_out_1", is_echo: true },
  };
  await postMessage(aiIgId, ourEcho);
  const afterOurEcho = sqlite
    .prepare(`SELECT COUNT(*) AS total FROM human_takeovers WHERE account_id = ?`)
    .get(aiAccountId) as any;
  assert.strictEqual(Number(afterOurEcho.total), 0, "an echo of our own DM is not a takeover");

  const humanEcho = {
    sender: { id: aiIgId },
    recipient: { id: leadIg },
    timestamp: now * 1000,
    message: { mid: "mid_human_reply_1", is_echo: true },
  };
  await postMessage(aiIgId, humanEcho);
  const takeover: any = sqlite
    .prepare(`SELECT * FROM human_takeovers WHERE account_id = ? AND thread_id = ?`)
    .get(aiAccountId, leadIg);
  assert.ok(takeover, "a human echo pauses that thread");
  assert.ok(Number(takeover.paused_until) > now);

  // Redelivery must not add a second row (the unique index + upsert).
  await postMessage(aiIgId, humanEcho);
  const takeoverCount = sqlite
    .prepare(`SELECT COUNT(*) AS total FROM human_takeovers WHERE account_id = ?`)
    .get(aiAccountId) as any;
  assert.strictEqual(Number(takeoverCount.total), 1, "one pause row per thread");

  // The AI now stays silent on the paused thread.
  await postMessage(aiIgId, inbound("mid_in_4", "hello"));
  assert.strictEqual(sent.length, 2, "human takeover gates the AI");

  // A frustrated lead also stops the AI on that thread (no model call, no send).
  const frustratedLead = "lead_p13_frustrated";
  await postMessage(aiIgId, {
    sender: { id: frustratedLead },
    recipient: { id: aiIgId },
    timestamp: now * 1000,
    message: { mid: "mid_frustrated_1", text: "this is a scam, I want a refund" },
  });
  assert.strictEqual(sent.length, 2, "frustration is never auto-answered");
  const frustrationPause = sqlite
    .prepare(`SELECT 1 FROM human_takeovers WHERE account_id = ? AND thread_id = ?`)
    .get(aiAccountId, frustratedLead);
  assert.ok(frustrationPause, "a frustrated thread is handed to a human");
  console.log("   ✓ Echo provenance is tracked; takeover is one row per thread.");

  metaGraphClient.sendDirectMessage = originalSend;

  // ════════════════════════════════════════════════════════════════
  // 5. Token refresh re-exchanges the USER token
  // ════════════════════════════════════════════════════════════════
  console.log("\n[5] Token refresh uses the user token and re-derives the page token...");
  const legacyAccountId = "acc_p13_legacy";
  await upsertConnectedAccount(mockDb, {
    id: legacyAccountId,
    userId: creator.userId,
    instagramUserId: "ig_p13_legacy",
    username: "legacy.creator",
    accessTokenEncrypted: await encryptSecret("OLD_PAGE_TOKEN", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now - 5 * 86400,
    // No user token: connected before this fix. Refresh cannot work.
  });

  const refreshAccountId = "acc_p13_refresh";
  const refreshIgId = "ig_p13_refresh";
  await upsertConnectedAccount(mockDb, {
    id: refreshAccountId,
    userId: creator.userId,
    instagramUserId: refreshIgId,
    username: "refresh.creator",
    accessTokenEncrypted: await encryptSecret("OLD_PAGE_TOKEN", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now - 5 * 86400,
    userTokenEncrypted: await encryptSecret("OLD_USER_TOKEN", env.ENCRYPTION_MASTER_KEY!),
    userTokenExpiresAt: now + 30 * 86400,
  });

  const originalExchange = metaGraphClient.exchangeForLongLivedToken;
  const originalPages = metaGraphClient.getConnectedAccounts;
  let exchangeCalls: string[] = [];
  metaGraphClient.exchangeForLongLivedToken = async (_appId, _secret, token) => {
    exchangeCalls.push(token);
    return { access_token: "NEW_USER_TOKEN", token_type: "bearer", expires_in: 5184000 };
  };
  metaGraphClient.getConnectedAccounts = async () => [
    {
      pageId: "page_p13",
      pageName: "Phase 13 page",
      pageAccessToken: "NEW_PAGE_TOKEN",
      instagramAccountId: refreshIgId,
      instagramUsername: "refresh.creator",
    },
  ];

  const refreshResult = await refreshExpiringTokens(env, { limit: 10 });
  assert.strictEqual(refreshResult.failed, 1, "a legacy row without a user token fails");
  assert.strictEqual(refreshResult.refreshed, 1, "the row with a user token refreshes");
  assert.ok(
    !exchangeCalls.includes("OLD_PAGE_TOKEN"),
    "a page token is never sent to the user-token grant"
  );
  assert.ok(exchangeCalls.includes("OLD_USER_TOKEN"), "the user token is what gets exchanged");

  const refreshed: any = sqlite
    .prepare(`SELECT * FROM connected_accounts WHERE id = ?`)
    .get(refreshAccountId);
  assert.strictEqual(
    await decryptSecret(refreshed.access_token_encrypted, env.ENCRYPTION_MASTER_KEY!),
    "NEW_PAGE_TOKEN"
  );
  assert.strictEqual(
    await decryptSecret(refreshed.user_token_encrypted, env.ENCRYPTION_MASTER_KEY!),
    "NEW_USER_TOKEN"
  );
  assert.ok(Number(refreshed.token_expires_at) > now, "the new expiry is in the future");

  const legacyAudit: any = sqlite
    .prepare(
      `SELECT status_code FROM webhook_logs
        WHERE account_id = ? AND event_type = 'token_refresh_attempt'
        ORDER BY created_at DESC LIMIT 1`
    )
    .get(legacyAccountId);
  assert.strictEqual(Number(legacyAudit.status_code), 409, "legacy rows are flagged for reconnect");

  metaGraphClient.exchangeForLongLivedToken = originalExchange;
  metaGraphClient.getConnectedAccounts = originalPages;
  console.log("   ✓ User token exchanged, page token re-derived, legacy rows flagged.");

  // ════════════════════════════════════════════════════════════════
  // 6. Campaign window and card validation
  // ════════════════════════════════════════════════════════════════
  console.log("\n[6] HUMAN_AGENT widens the window only when approved; cards are validated...");
  const campaignAccountId = "acc_p13_campaign";
  await upsertConnectedAccount(mockDb, {
    id: campaignAccountId,
    userId: creator.userId,
    instagramUserId: "ig_p13_campaign",
    username: "campaign.creator",
    accessTokenEncrypted: await encryptSecret("EAAB_campaign", env.ENCRYPTION_MASTER_KEY!),
    tokenExpiresAt: now + 5184000,
  });
  const threeDaysAgo = now - 3 * 86400;
  sqlite
    .prepare(
      `INSERT INTO captured_leads
         (id, account_id, instagram_scoped_id, username, first_interaction_at, last_inbound_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run("lead_p13_old", campaignAccountId, "lead_p13_old_ig", "old.lead", threeDaysAgo, threeDaysAgo);

  const cardBody = (buttons: unknown[]) => ({
    accountId: campaignAccountId,
    mediaId: "reel_p13_campaign",
    kind: "card",
    card: { title: "New drop", subtitle: "Today only", buttons },
    usesHumanAgentTag: true,
  });

  const tooManyButtons = await req("/api/campaigns", {
    method: "POST",
    headers: creator.auth,
    body: JSON.stringify(
      cardBody([
        { title: "One", url: "https://shop.test/1" },
        { title: "Two", url: "https://shop.test/2" },
        { title: "Three", url: "https://shop.test/3" },
        { title: "Four", url: "https://shop.test/4" },
      ])
    ),
  });
  assert.strictEqual(tooManyButtons.status, 400, "a fourth button is rejected at compose time");
  assert.strictEqual(((await tooManyButtons.json()) as any).error.code, "INVALID_CARD");

  const insecureUrl = await req("/api/campaigns", {
    method: "POST",
    headers: creator.auth,
    body: JSON.stringify(cardBody([{ title: "Shop", url: "http://shop.test/1" }])),
  });
  assert.strictEqual(insecureUrl.status, 400, "http:// button URLs are rejected");

  const unapproved = await req("/api/campaigns", {
    method: "POST",
    headers: creator.auth,
    body: JSON.stringify(cardBody([{ title: "Shop", url: "https://shop.test/1" }])),
  });
  assert.strictEqual(unapproved.status, 201);
  const unapprovedJson: any = await unapproved.json();
  assert.strictEqual(
    unapprovedJson.data.reachability.unreachable,
    1,
    "without META_HUMAN_AGENT_APPROVED the window stays 24h"
  );

  env.META_HUMAN_AGENT_APPROVED = "1";
  const approved = await req("/api/campaigns", {
    method: "POST",
    headers: creator.auth,
    body: JSON.stringify(cardBody([{ title: "Shop", url: "https://shop.test/1" }])),
  });
  assert.strictEqual(approved.status, 201);
  const approvedJson: any = await approved.json();
  assert.strictEqual(
    approvedJson.data.reachability.reachable,
    1,
    "with approval the same lead is inside the 7-day window"
  );
  env.META_HUMAN_AGENT_APPROVED = undefined;
  console.log("   ✓ 24h vs 7d window follows the approval flag; bad cards never stored.");

  // ════════════════════════════════════════════════════════════════
  // 7. Retention purge covers the new tables
  // ════════════════════════════════════════════════════════════════
  console.log("\n[7] Retention purge prunes mids, AI state and expired takeovers...");
  const stale = now - 30 * 86400;
  sqlite
    .prepare(
      `INSERT INTO message_mids (mid, account_id, thread_id, direction, created_at)
       VALUES ('mid_stale', ?, ?, 'in', ?)`
    )
    .run(aiAccountId, "thread_stale", stale);
  sqlite
    .prepare(
      `INSERT INTO ai_thread_state (account_id, thread_id, last_ai_reply_at, last_inbound_at)
       VALUES (?, 'thread_stale', ?, ?)`
    )
    .run(aiAccountId, stale, stale);
  sqlite
    .prepare(
      `INSERT INTO human_takeovers (id, account_id, thread_id, paused_until)
       VALUES ('takeover_stale', ?, 'thread_stale', ?)`
    )
    .run(aiAccountId, stale);

  const purge = await purgeRetentionData(mockDb);
  assert.ok(purge.midsDeleted >= 1, "stale mids are deleted");
  assert.ok(purge.aiStateDeleted >= 1, "stale AI clock rows are deleted");
  assert.ok(purge.takeoversDeleted >= 1, "expired takeovers are deleted");
  assert.strictEqual(
    sqlite.prepare(`SELECT 1 FROM message_mids WHERE mid = 'mid_stale'`).get(),
    undefined
  );
  console.log("   ✓ Retention covers every new table.");

  console.log("\n🎉 ALL PHASE 13 SECURITY TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Phase 13 Test Failed:", err);
  process.exit(1);
});
