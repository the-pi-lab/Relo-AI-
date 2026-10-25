/**
 * Phase 15 — "auth works, connect works, automation never fires" audit suite.
 *
 * The real-world failure this suite locks down was invisible: every layer said
 * OK while nothing happened. Five things are covered:
 *
 *   1. Webhook fields are split by Graph node. Sending `comments` together with
 *      `messages`/`messaging_postbacks` makes Meta reject the *whole* request,
 *      which silently killed the comment subscription too.
 *   2. A 200 carrying `{ data: [] }` is not a success. The old truthiness check
 *      (`data.success || data.data`) read the empty array as success.
 *   3. Every early return in the comment webhook now writes an audit row, so a
 *      delivered-but-dropped comment is debuggable instead of invisible.
 *   4. `INSERT OR IGNORE` dedupe is distinguished from a rejected insert.
 *   5. `scheduled` writes a cron heartbeat, and `/api/accounts/:id/health`
 *      reports which boundary is broken from data (not guesswork).
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { encryptSecret } from "../src/crypto";
import { getCronHeartbeat, upsertConnectedAccount } from "../src/db/queries";
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
/** A real Page id shape — `getPageIdForToken` only accepts digits. */
const PAGE_ID = "109876543210";

/** Official Meta webhook signature. */
async function computeSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return (
    "sha256=" +
    Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

type SubscriptionMode = "ok" | "comments-only" | "rejected";

interface GraphCallRecord {
  url: string;
  method: string;
  fields: string[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function runTests() {
  console.log("=== RUNNING PHASE 15 PIPELINE AUDIT SUITE ===");

  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase15_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    META_APP_SECRET: "meta_app_secret_phase15",
    META_VERIFY_TOKEN: "verify_phase15",
    META_GRAPH_API_VERSION: "v21.0",
    PUBLIC_BASE_URL: "https://engine.relo.test",
    PUBLIC_APP_URL: "https://app.relo.test",
  } as unknown as Env;

  const req = (p: string, init: RequestInit = {}, ctx: any = {} as any) =>
    worker.fetch(new Request(`${BASE}${p}`, init), env, ctx);

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
      auth: {
        Authorization: `Bearer ${json.data.token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const now = Math.floor(Date.now() / 1000);

  // ── Graph stub ───────────────────────────────────────────────────────────
  const graphCalls: GraphCallRecord[] = [];
  let subscriptionMode: SubscriptionMode = "ok";
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: any, init?: any): Promise<Response> => {
    const url = typeof input === "string" ? input : input.url;
    const method = String(init?.method || "GET").toUpperCase();
    const parsed = new URL(url);

    if (parsed.pathname.endsWith("/subscribed_apps")) {
      const rawFields = parsed.searchParams.get("subscribed_fields") || "";
      const fields = rawFields ? rawFields.split(",") : [];
      graphCalls.push({ url, method, fields });

      if (method === "POST") {
        // Meta validates the whole list against one node: one invalid field
        // rejects every field. The stub must reproduce that, otherwise the
        // regression this suite exists for cannot fail the test.
        if (fields.includes("comments") && fields.includes("messages")) {
          return jsonResponse({ error: { message: "field mix rejected" } }, 400);
        }
        if (subscriptionMode === "rejected") {
          return jsonResponse({ data: [] }, 200);
        }
        if (subscriptionMode === "comments-only" && fields.includes("messages")) {
          return jsonResponse({ error: { message: "page not eligible" } }, 400);
        }
        return jsonResponse({ success: true }, 200);
      }

      if (subscriptionMode === "rejected") return jsonResponse({ data: [] }, 200);
      if (subscriptionMode === "comments-only") {
        return jsonResponse({ data: [{ subscribed_fields: ["comments"] }] }, 200);
      }
      return jsonResponse(
        { data: [{ subscribed_fields: ["comments", "messages", "messaging_postbacks"] }] },
        200
      );
    }

    if (parsed.pathname.endsWith("/me")) {
      return jsonResponse({ id: PAGE_ID }, 200);
    }

    return jsonResponse({ error: { message: `unexpected Graph call ${url}` } }, 400);
  }) as any;

  try {
    // ════════════════════════════════════════════════════════════════
    // 1. Fields are split per node, and empty `data` is not success
    // ════════════════════════════════════════════════════════════════
    console.log("\n[1] Webhook subscription splits fields and verifies the result...");

    subscriptionMode = "ok";
    graphCalls.length = 0;
    const okResult = await metaGraphClient.subscribeAppToInstagram("EAAB_token", "ig_p15_main");
    assert.strictEqual(okResult.commentsReady, true, "comments subscribe succeeds");
    assert.strictEqual(okResult.messagingReady, true, "messaging subscribe succeeds on the page");
    assert.strictEqual(okResult.verifiedComments, true, "read-back confirms comments");
    assert.strictEqual(okResult.pageId, PAGE_ID, "the owning page is discovered");

    const mixed = graphCalls.filter(
      (c) => c.method === "POST" && c.fields.includes("comments") && c.fields.includes("messages")
    );
    assert.strictEqual(
      mixed.length,
      0,
      "a single POST must never carry comment and messaging fields together"
    );
    const messagingOnPage = graphCalls.some(
      (c) => c.method === "POST" && c.url.includes(PAGE_ID) && c.fields.includes("messages")
    );
    assert.ok(messagingOnPage, "messaging fields go to the Page node");
    console.log("   ✓ Comment and messaging fields are subscribed on their own nodes.");

    subscriptionMode = "comments-only";
    graphCalls.length = 0;
    const partial = await metaGraphClient.subscribeAppToInstagram("EAAB_token", "ig_p15_main");
    assert.strictEqual(partial.commentsReady, true, "comments still succeed");
    assert.strictEqual(partial.messagingReady, false, "messaging failure is reported, not hidden");
    assert.strictEqual(partial.verifiedComments, true);
    assert.ok(partial.errors.length > 0, "the per-node error is surfaced to the caller");
    console.log("   ✓ A messaging-only rejection no longer takes comments down with it.");

    subscriptionMode = "rejected";
    const empty = await metaGraphClient.subscribeAppToInstagram("EAAB_token", "ig_p15_main");
    assert.strictEqual(
      empty.commentsReady,
      false,
      "`{ data: [] }` on a 200 is an empty listing, not a successful subscribe"
    );
    assert.strictEqual(empty.verifiedComments, false);
    assert.strictEqual(empty.success, false);
    console.log("   ✓ An empty listing is treated as failure.");

    // ════════════════════════════════════════════════════════════════
    // 2. Seed a real creator, account and automation through the API
    // ════════════════════════════════════════════════════════════════
    console.log("\n[2] Seeding creator, account and automation...");
    subscriptionMode = "ok";
    const creator = await signUp("creator@phase15.test");
    const accountId = "acc_p15_main";
    await upsertConnectedAccount(mockDb, {
      id: accountId,
      userId: creator.userId,
      instagramUserId: "ig_p15_main",
      username: "p15.creator",
      accessTokenEncrypted: await encryptSecret("EAAB_p15_token", env.ENCRYPTION_MASTER_KEY!),
      tokenExpiresAt: now + 5184000,
    });

    const saveAutomation = await req("/api/automations", {
      method: "POST",
      headers: creator.auth,
      body: JSON.stringify({
        accountId,
        instagramMediaId: "reel_p15_main",
        reelPermalink: "https://instagram.com/reel/p15",
        triggerKeywords: ["GUIDE"],
        // Free tier runs exactly 2 reply variations; Pro allows 3–8.
        commentReplies: ["Sent! @username", "In your DMs @username"],
        templateCard: {
          title: "Phase 15 blueprint",
          buttons: [{ type: "web_url", title: "Get it", url: "https://shop.test/p15" }],
        },
        isActive: true,
      }),
    });
    assert.strictEqual(saveAutomation.status, 200, "automation save succeeds");
    const saveJson: any = await saveAutomation.json();
    assert.strictEqual(
      saveJson.data.webhookSubscription?.commentsReady,
      true,
      "the save response reports the live subscription state"
    );
    console.log("   ✓ Automation saved with its webhook readiness attached.");

    // ════════════════════════════════════════════════════════════════
    // 3. Every early return leaves an audit row
    // ════════════════════════════════════════════════════════════════
    console.log("\n[3] Comment outcomes are recorded, not swallowed...");

    const auditEventTypes = () =>
      (sqlite.prepare(`SELECT event_type FROM webhook_logs ORDER BY created_at`).all() as any[]).map(
        (r) => String(r.event_type)
      );

    const lastAuditFor = (commentId: string) =>
      (sqlite
        .prepare(
          `SELECT event_type, account_id FROM webhook_logs
            WHERE payload LIKE ? ORDER BY rowid DESC LIMIT 1`
        )
        .get(`%${commentId}%`) as any) || null;

    const sendComment = async (
      instagramAccountId: string,
      mediaId: string,
      text: string,
      commentId: string
    ) => {
      const body = JSON.stringify({
        object: "instagram",
        entry: [
          {
            id: instagramAccountId,
            time: Date.now(),
            changes: [
              {
                field: "comments",
                value: {
                  id: commentId,
                  text,
                  from: { id: "ig_p15_viewer", username: "p15.viewer" },
                  media: { id: mediaId },
                },
              },
            ],
          },
        ],
      });
      const signature = await computeSignature(body, env.META_APP_SECRET!);
      let background: Promise<void> | null = null;
      const ctx = {
        waitUntil(promise: Promise<void>) {
          background = promise;
        },
        passThroughOnException() {},
      };
      const response = await worker.fetch(
        new Request(`${BASE}/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-hub-signature-256": signature },
          body,
        }),
        env,
        ctx as any
      );
      assert.strictEqual(response.status, 200, "Meta always gets an instant 200");
      if (background) await background;
      return (await response.json()) as any;
    };

    await sendComment("ig_p15_ghost", "reel_p15_main", "GUIDE", "cmt_p15_no_account");
    assert.strictEqual(
      lastAuditFor("cmt_p15_no_account")?.event_type,
      "comment_no_account",
      "an unknown Instagram account id is recorded"
    );

    await sendComment("ig_p15_main", "reel_p15_other", "GUIDE", "cmt_p15_wrong_reel");
    assert.strictEqual(
      lastAuditFor("cmt_p15_wrong_reel")?.event_type,
      "comment_no_automation_for_media",
      "a comment on an unarmed Reel is recorded"
    );

    await sendComment("ig_p15_main", "reel_p15_main", "nice reel!", "cmt_p15_no_keyword");
    assert.strictEqual(
      lastAuditFor("cmt_p15_no_keyword")?.event_type,
      "comment_no_keyword_match",
      "a comment without the trigger word is recorded"
    );

    await sendComment("ig_p15_main", "reel_p15_main", "send the GUIDE please", "cmt_p15_enqueued");
    assert.strictEqual(
      lastAuditFor("cmt_p15_enqueued")?.event_type,
      "comment_enqueued",
      "a matched comment is queued and recorded"
    );
    const queuedJob = sqlite
      .prepare(`SELECT status, response_mid FROM jobs WHERE comment_id = 'cmt_p15_enqueued'`)
      .get() as any;
    assert.strictEqual(queuedJob?.status, "pending", "the job waits for the anti-spam jitter");

    await sendComment("ig_p15_main", "reel_p15_main", "send the GUIDE please", "cmt_p15_enqueued");
    assert.strictEqual(
      lastAuditFor("cmt_p15_enqueued")?.event_type,
      "comment_duplicate",
      "a redelivery is recorded as a duplicate, not as a new job"
    );
    const jobCount = sqlite
      .prepare(`SELECT COUNT(*) AS n FROM jobs WHERE comment_id = 'cmt_p15_enqueued'`)
      .get() as any;
    assert.strictEqual(Number(jobCount.n), 1, "dedupe still holds exactly one job");

    console.log("   ✓ no_account / wrong_reel / no_keyword / enqueued / duplicate all traced.");

    // ════════════════════════════════════════════════════════════════
    // 4. scheduled writes a heartbeat
    // ════════════════════════════════════════════════════════════════
    console.log("\n[4] The cron heartbeat proves the trigger is deployed...");

    let cronWork: Promise<unknown> | null = null;
    const cronCtx = {
      waitUntil(promise: Promise<unknown>) {
        cronWork = promise;
      },
      passThroughOnException() {},
    };
    await worker.scheduled(
      { cron: "* * * * *", scheduledTime: Date.now(), noRetry() {} } as any,
      env,
      cronCtx as any
    );
    if (cronWork) await cronWork;

    const heartbeat = await getCronHeartbeat(mockDb);
    assert.ok(heartbeat.lastRunAt > 0, "the scheduled handler records a heartbeat");
    assert.ok(heartbeat.ticks >= 1, "the heartbeat counts ticks");
    assert.ok(
      now - heartbeat.lastRunAt < 120,
      "the heartbeat timestamp is fresh, not a stale leftover"
    );
    console.log(`   ✓ Heartbeat written (ticks: ${heartbeat.ticks}).`);

    // ════════════════════════════════════════════════════════════════
    // 5. The health endpoint names the broken boundary
    // ════════════════════════════════════════════════════════════════
    console.log("\n[5] /api/accounts/:id/health diagnoses from data...");

    subscriptionMode = "ok";
    const healthy = await req(`/api/accounts/${accountId}/health`, {
      headers: creator.auth,
    });
    assert.strictEqual(healthy.status, 200, "the health endpoint responds");
    const healthyJson: any = await healthy.json();
    const codes = (body: any) => body.data.diagnosis.map((d: any) => d.code);

    assert.strictEqual(healthyJson.data.healthy, true, "a working pipeline is reported healthy");
    assert.strictEqual(healthyJson.data.webhook.subscription.commentsReady, true);
    assert.strictEqual(healthyJson.data.automations.active, 1);
    assert.ok(
      codes(healthyJson).includes("COMMENT_ALREADY_HANDLED"),
      "the last inbound comment outcome is reported"
    );
    assert.ok(
      !codes(healthyJson).includes("CRON_NEVER_RAN"),
      "the heartbeat from step 4 clears the cron diagnosis"
    );
    assert.ok(!codes(healthyJson).includes("NO_WEBHOOK_EVER"));
    console.log("   ✓ Healthy pipeline: no critical diagnosis.");

    // A second account: automation armed, but Meta never subscribed its
    // comments and no webhook ever arrived — the exact real-world state.
    const brokenAccountId = "acc_p15_broken";
    await upsertConnectedAccount(mockDb, {
      id: brokenAccountId,
      userId: creator.userId,
      instagramUserId: "ig_p15_broken",
      username: "p15.broken",
      accessTokenEncrypted: await encryptSecret("EAAB_p15_broken", env.ENCRYPTION_MASTER_KEY!),
      tokenExpiresAt: now + 5184000,
    });
    sqlite
      .prepare(
        `INSERT INTO reel_automations
           (id, account_id, instagram_media_id, reel_permalink, trigger_keywords,
            comment_replies, template_card, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .run(
        "auto_p15_broken",
        brokenAccountId,
        "reel_p15_broken",
        "https://instagram.com/reel/p15b",
        JSON.stringify(["GUIDE"]),
        JSON.stringify(["Sent! @username", "In DMs @username", "Check DMs @username"]),
        JSON.stringify({ title: "Broken", buttons: [] })
      );

    subscriptionMode = "rejected";
    const broken = await req(`/api/accounts/${brokenAccountId}/health`, {
      headers: creator.auth,
    });
    assert.strictEqual(broken.status, 200);
    const brokenJson: any = await broken.json();
    const brokenCodes = codes(brokenJson);
    assert.strictEqual(brokenJson.data.healthy, false, "a dead pipeline is not healthy");
    assert.ok(
      brokenCodes.includes("COMMENTS_NOT_SUBSCRIBED"),
      "the missing comment subscription is named"
    );
    assert.ok(brokenCodes.includes("NO_WEBHOOK_EVER"), "the silent webhook path is named");
    assert.ok(
      !brokenCodes.includes("NO_ACTIVE_AUTOMATION"),
      "the diagnosis does not blame a correctly armed automation"
    );
    console.log("   ✓ Broken pipeline: COMMENTS_NOT_SUBSCRIBED + NO_WEBHOOK_EVER.");

    // Health must never mutate Meta state.
    const postsBefore = graphCalls.filter((c) => c.method === "POST").length;
    graphCalls.length = 0;
    await req(`/api/accounts/${accountId}/health`, { headers: creator.auth });
    assert.strictEqual(
      graphCalls.filter((c) => c.method === "POST").length,
      0,
      "the health read never subscribes or writes"
    );
    void postsBefore;

    console.log("\n🎉 ALL PHASE 15 PIPELINE AUDIT TESTS PASSED!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests().catch((error) => {
  console.error("\n❌ PHASE 15 TESTS FAILED:", error);
  process.exitCode = 1;
});
