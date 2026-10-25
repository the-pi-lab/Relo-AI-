/**
 * PHASE 14 — BILLING LIFECYCLE, SESSION REVOCATION, SOFT DISCONNECT
 *
 * Regression suite for the hardening batch:
 *   1. A JWT is only accepted while its `jti` has a live `sessions` row.
 *      Logout and "sign out everywhere" actually revoke.
 *   2. A paid plan carries `plan_expires_at`; cron downgrades it to Free when
 *      it lapses. `0` means grandfathered and is never touched.
 *   3. The Lemon Squeezy webhook verifies `X-Signature`, maps variants to
 *      tiers, activates once per order (idempotent), and ends access on
 *      cancellation/refund — but never grants a plan to the client.
 *   4. Disconnecting an account is a soft delete: the row and its history stay,
 *      tokens are wiped, the slot is freed, and reconnect reactivates it.
 *   5. Each cron stage is isolated: retention can fail without skipping the
 *      billing downgrade that follows it.
 *   6. `META_GRAPH_API_VERSION` is validated before it reaches a URL.
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
import { signJwt } from "../src/auth";
import {
  activatePlanForUser,
  deleteConnectedAccount,
  expireDuePlans,
  getAccountsForUser,
  getUserBilling,
  getUserByEmail,
  upsertConnectedAccount,
} from "../src/db/queries";
import { getMetaGraphVersion, setMetaGraphVersion } from "../src/meta/client";

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

async function hmacHex(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function runTests() {
  console.log("=== RUNNING PHASE 14 BILLING & SESSION SUITE ===");

  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase14_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    META_APP_ID: "meta_app_id_phase14",
    META_APP_SECRET: "meta_app_secret_phase14",
    META_VERIFY_TOKEN: "verify_phase14",
    META_GRAPH_API_VERSION: "v21.0",
    PUBLIC_BASE_URL: "https://engine.relo.test",
    PUBLIC_APP_URL: "https://app.relo.test",
    LEMON_SQUEEZY_WEBHOOK_SECRET: "lemon_webhook_secret_phase14",
    LEMON_SQUEEZY_PRO_VARIANT_ID: "111",
    LEMON_SQUEEZY_STUDIO_VARIANT_ID: "222",
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
      token: json.data.token as string,
      auth: {
        Authorization: `Bearer ${json.data.token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const seedAccount = async (userId: string, id: string, igId: string) =>
    upsertConnectedAccount(mockDb, {
      id,
      userId,
      instagramUserId: igId,
      username: `user_${igId}`,
      accessTokenEncrypted: await encryptSecret("EAAB_phase14_token", env.ENCRYPTION_MASTER_KEY!),
      tokenExpiresAt: now + 5_184_000,
    });

  // ═══════════════════════════════════════════════════════════════
  // 1. Session ledger: logout is a real revocation
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[1] Sessions can be revoked (logout + logout-all)...");
  const owner = await signUp("owner@phase14.test");

  const live = await req("/api/billing", { headers: owner.auth });
  assert.strictEqual(live.status, 200, "a fresh session works");

  const logout = await req("/api/auth/logout", {
    method: "POST",
    headers: owner.auth,
  });
  assert.strictEqual(logout.status, 200);

  const afterLogout = await req("/api/billing", { headers: owner.auth });
  assert.strictEqual(afterLogout.status, 401, "the revoked token is rejected immediately");

  const owner2 = await signUp("owner2@phase14.test");
  const logoutAll = await req("/api/auth/logout-all", {
    method: "POST",
    headers: owner2.auth,
  });
  const logoutAllJson: any = await logoutAll.json();
  assert.ok(logoutAllJson.data.sessionsRevoked >= 1);
  assert.strictEqual(
    (await req("/api/billing", { headers: owner2.auth })).status,
    401,
    "logout-all revokes the caller's own token too"
  );

  // A signed token with no session row is invalid even if its signature is real.
  const orphanJti = crypto.randomUUID();
  const orphanToken = await signJwt(
    { sub: owner.userId as any, email: "owner@phase14.test", jti: orphanJti },
    env.JWT_SECRET
  );
  assert.strictEqual(
    (
      await req("/api/billing", {
        headers: { Authorization: `Bearer ${orphanToken}` },
      })
    ).status,
    401,
    "a token without a live session is not accepted"
  );
  console.log("   ✓ Logout, logout-all and missing-session tokens all fail closed.");

  // ═══════════════════════════════════════════════════════════════
  // 2. Plan expiry
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[2] Lapsed plans downgrade; grandfathered plans do not...");
  const expiring = await signUp("expiring@phase14.test");
  await seedAccount(expiring.userId, "acc_p14_expiring", "ig_p14_expiring");
  await activatePlanForUser(mockDb, expiring.userId, "pro", now - 60);

  const beforeExpiry = await getUserBilling(mockDb, expiring.userId);
  assert.strictEqual(beforeExpiry?.plan, "pro");
  assert.strictEqual(await expireDuePlans(mockDb, 100), 1);

  const afterExpiry = await getUserBilling(mockDb, expiring.userId);
  assert.strictEqual(afterExpiry?.plan, "free", "the lapsed plan returns to Free");
  assert.strictEqual(afterExpiry?.planExpiresAt, 0);
  assert.strictEqual(afterExpiry?.aiCreditsRemaining, 3, "Free credits are restored");
  const mirror = sqlite
    .prepare(`SELECT plan FROM connected_accounts WHERE id = 'acc_p14_expiring'`)
    .get() as any;
  assert.strictEqual(mirror.plan, "free", "the account mirror follows the user row");

  const grandfathered = await signUp("grandfathered@phase14.test");
  await activatePlanForUser(mockDb, grandfathered.userId, "studio");
  assert.strictEqual(await expireDuePlans(mockDb, 100), 0);
  assert.strictEqual(
    (await getUserBilling(mockDb, grandfathered.userId))?.plan,
    "studio",
    "plan_expires_at = 0 is never auto-downgraded"
  );
  console.log("   ✓ Expiry is explicit; comped plans survive cron.");

  // ═══════════════════════════════════════════════════════════════
  // 3. Lemon Squeezy webhook
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[3] Lemon Squeezy webhook: signature, idempotency, cancellation...");
  const webhookSecret = env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

  const postLemon = async (payload: unknown, signature?: string) => {
    const body = JSON.stringify(payload);
    const sig = signature ?? (await hmacHex(body, webhookSecret));
    return req("/api/billing/lemonsqueezy", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Signature": sig },
      body,
    });
  };

  const orderPayload = {
    meta: { event_name: "order_created" },
    data: {
      id: "ls_order_phase14",
      type: "orders",
      attributes: {
        user_email: "buyer@phase14.test",
        status: "paid",
        total: 19900,
        currency: "INR",
        first_order_item: { variant_id: 111 },
      },
    },
  };

  const badSig = await postLemon(orderPayload, "deadbeef");
  assert.strictEqual(badSig.status, 401, "a bad signature is rejected");

  const order = await postLemon(orderPayload);
  assert.strictEqual(order.status, 200);
  const orderJson: any = await order.json();
  assert.strictEqual(orderJson.data.activated, true);
  assert.strictEqual(orderJson.data.plan, "pro");

  const buyer = await getUserByEmail(mockDb, "buyer@phase14.test");
  assert.ok(buyer, "a paid buyer gets an account even before their first login");
  const buyerBilling = await getUserBilling(mockDb, buyer!.id);
  assert.strictEqual(buyerBilling?.plan, "pro");
  assert.ok(
    Math.abs((buyerBilling?.planExpiresAt ?? 0) - (now + 30 * 86400)) <= 5,
    "the order grants ~30 days"
  );
  const payment = sqlite
    .prepare(
      `SELECT status, plan, amount_inr FROM payments
        WHERE provider = 'lemon_squeezy' AND external_ref = 'ls_order_phase14'`
    )
    .get() as any;
  assert.ok(payment, "the verified payment is recorded");
  assert.strictEqual(payment.status, "verified");
  assert.strictEqual(payment.amount_inr, 199);

  const expiryAfterFirst = buyerBilling?.planExpiresAt;
  const duplicate = await postLemon(orderPayload);
  const duplicateJson: any = await duplicate.json();
  assert.strictEqual(duplicateJson.data.duplicate, true);
  assert.strictEqual(
    (await getUserBilling(mockDb, buyer!.id))?.planExpiresAt,
    expiryAfterFirst,
    "a retried webhook never grants a second month"
  );

  const unknown = await postLemon({ meta: { event_name: "subscription_payment_failed" } });
  assert.strictEqual(unknown.status, 200, "unknown events are acknowledged, not retried");
  assert.strictEqual(((await unknown.json()) as any).data.ignored, true);

  const unmapped = await postLemon({
    meta: { event_name: "order_created" },
    data: {
      id: "ls_order_unmapped",
      attributes: {
        user_email: "buyer@phase14.test",
        status: "paid",
        total: 100,
        first_order_item: { variant_id: 999 },
      },
    },
  });
  assert.strictEqual(unmapped.status, 200);
  assert.strictEqual(((await unmapped.json()) as any).data.reason, "unmapped_variant");

  const renewsAt = new Date((now + 40 * 86400) * 1000).toISOString();
  const upgrade = await postLemon({
    meta: { event_name: "subscription_updated" },
    data: {
      id: "ls_sub_phase14",
      attributes: {
        user_email: "buyer@phase14.test",
        status: "active",
        variant_id: 222,
        renews_at: renewsAt,
      },
    },
  });
  assert.strictEqual(upgrade.status, 200);
  const upgraded = await getUserBilling(mockDb, buyer!.id);
  assert.strictEqual(upgraded?.plan, "studio", "variant 222 maps to Studio");
  assert.ok(
    Math.abs((upgraded?.planExpiresAt ?? 0) - (now + 40 * 86400)) <= 5,
    "the renewal timestamp becomes the expiry"
  );

  const endsAt = new Date((now + 5 * 86400) * 1000).toISOString();
  const cancelled = await postLemon({
    meta: { event_name: "subscription_cancelled" },
    data: {
      id: "ls_sub_phase14",
      attributes: {
        user_email: "buyer@phase14.test",
        status: "cancelled",
        variant_id: 222,
        ends_at: endsAt,
      },
    },
  });
  assert.strictEqual(cancelled.status, 200);
  const cancelledBilling = await getUserBilling(mockDb, buyer!.id);
  assert.strictEqual(cancelledBilling?.plan, "studio", "cancellation does not cut the paid period short");
  assert.ok(Math.abs((cancelledBilling?.planExpiresAt ?? 0) - (now + 5 * 86400)) <= 5);

  const refunded = await postLemon({
    meta: { event_name: "order_refunded" },
    data: {
      id: "ls_order_phase14",
      attributes: {
        user_email: "buyer@phase14.test",
        status: "refunded",
        first_order_item: { variant_id: 111 },
      },
    },
  });
  assert.strictEqual(refunded.status, 200);
  assert.strictEqual(
    (await getUserBilling(mockDb, buyer!.id))?.plan,
    "free",
    "a refund ends access immediately"
  );
  console.log("   ✓ Signed, idempotent, upgrade-aware, and cancellation-safe.");

  // ═══════════════════════════════════════════════════════════════
  // 4. Soft disconnect
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[4] Disconnect keeps history, wipes tokens, frees the slot...");
  const seller = await signUp("seller@phase14.test");
  await seedAccount(seller.userId, "acc_p14_seller", "ig_p14_seller");
  await activatePlanForUser(mockDb, seller.userId, "pro", now + 30 * 86400);
  sqlite
    .prepare(
      `INSERT INTO payments (id, account_id, user_id, provider, plan, amount_inr, status)
       VALUES ('pay_p14', 'acc_p14_seller', ?, 'manual_upi', 'pro', 199, 'verified')`
    )
    .run(seller.userId);

  assert.strictEqual(
    await deleteConnectedAccount(mockDb, "acc_p14_seller", seller.userId),
    true
  );
  const row = sqlite
    .prepare(
      `SELECT is_active, access_token_encrypted, user_token_encrypted
         FROM connected_accounts WHERE id = 'acc_p14_seller'`
    )
    .get() as any;
  assert.strictEqual(row.is_active, 0, "the row is retained but inactive");
  assert.strictEqual(row.access_token_encrypted, "", "the page token is wiped");
  assert.strictEqual(row.user_token_encrypted, null, "the user token is wiped");
  assert.strictEqual(
    (await getAccountsForUser(mockDb, seller.userId)).length,
    0,
    "the slot is freed"
  );
  const keptPayment = sqlite
    .prepare(`SELECT account_id FROM payments WHERE id = 'pay_p14'`)
    .get() as any;
  assert.strictEqual(keptPayment.account_id, null, "payment attribution is detached");

  await seedAccount(seller.userId, "acc_p14_seller_again", "ig_p14_seller");
  const active = await getAccountsForUser(mockDb, seller.userId);
  assert.strictEqual(active.length, 1, "reconnect reactivates the same Instagram id");
  assert.strictEqual(active[0].plan, "pro", "reconnect inherits the paid plan");
  assert.strictEqual(
    await deleteConnectedAccount(mockDb, "acc_p14_seller", "someone-else"),
    false,
    "a non-owner cannot disconnect the account"
  );
  console.log("   ✓ Soft delete preserves attribution without preserving credentials.");

  // ═══════════════════════════════════════════════════════════════
  // 5. Meta Graph version
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[5] META_GRAPH_API_VERSION is validated...");
  setMetaGraphVersion("v23.0");
  assert.strictEqual(getMetaGraphVersion(), "v23.0");
  setMetaGraphVersion("v24.0?access_token=evil");
  assert.strictEqual(getMetaGraphVersion(), "v23.0", "malformed versions are ignored");
  setMetaGraphVersion(undefined);
  assert.strictEqual(getMetaGraphVersion(), "v23.0", "unset env keeps the last valid value");
  setMetaGraphVersion("v21.0");
  console.log("   ✓ Only v<major>.<minor> reaches the Graph URL.");

  // ═══════════════════════════════════════════════════════════════
  // 6. Cron isolation
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[6] One failing cron stage does not skip billing...");
  const cronUserId = "user_p14_cron";
  sqlite
    .prepare(`INSERT INTO users (id, email) VALUES (?, ?)`)
    .run(cronUserId, "cron@phase14.test");
  await seedAccount(cronUserId, "acc_p14_cron", "ig_p14_cron");
  await activatePlanForUser(mockDb, cronUserId, "pro", now - 120);

  // Break the retention stage on purpose. The billing stage runs after it.
  sqlite.exec(`DROP TABLE webhook_logs`);

  let cronTask: Promise<void> | null = null;
  await worker.scheduled!({} as any, env, {
    waitUntil: (promise: Promise<any>) => {
      cronTask = promise as Promise<void>;
    },
  } as any);
  assert.ok(cronTask, "scheduled() registers the background work");
  await cronTask;

  assert.strictEqual(
    (await getUserBilling(mockDb, cronUserId))?.plan,
    "free",
    "plan expiry still runs after an earlier stage throws"
  );
  console.log("   ✓ Cron stages fail independently.");
}

runTests()
  .then(() => {
    console.log("\n🎉 ALL PHASE 14 BILLING & SESSION TESTS PASSED!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ PHASE 14 TESTS FAILED\n", error);
    process.exit(1);
  });
