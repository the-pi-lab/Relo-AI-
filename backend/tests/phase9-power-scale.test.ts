/**
 * Phase 9 test suite — POWER & SCALE (plan.md §7 Phase 3, foundation slice)
 *
 * Covers the backend foundation every later Phase 3 item stands on:
 *   • Campaigns (§4.3) — tier gate, reachability engine, 24h window,
 *     delivery classification, HUMAN_AGENT tag application
 *   • Canvas flows (§7) — Studio-only gate, linear-chain validation, CRUD
 *   • Priority queue (§5) — Studio jobs ordered ahead of Free/Pro in the batch
 *   • Referrals (§7) — deterministic codes, self-referral refusal, reward only
 *     after the referred person actually pays
 *   • Agency intake (§3) — bigger than 3 accounts is a conversation, not self-serve
 *
 * Runs against the same in-memory SQLite D1 mock as the other suites, so it
 * exercises the real schema.sql and the real router.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { validateFlowGraph, createStarterGraph } from "../src/engine/flowGraph";
import { buildCampaignMessage, applyHumanAgentTag, classifyCampaignFailure } from "../src/engine/campaignWorker";
import { makeReferralCode } from "../src/db/queries";
import { TIER_LIMITS, limitsFor, planSatisfies } from "../src/tiers";
import { TokenExpiredError, UserNotReachableError } from "../src/meta/errors";

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
  console.log("=== RUNNING PHASE 9 POWER & SCALE TEST SUITE ===");

  console.log("\n[1] Initializing D1 in-memory database with schema.sql...");
  const sqlite = new DatabaseSync(":memory:");
  const schemaPath = path.join(__dirname, "../schema.sql");
  sqlite.exec(fs.readFileSync(schemaPath, "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase9_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    ADMIN_SECRET: "admin_test_secret",
  } as unknown as Env;

  const req = (p: string, init: RequestInit = {}) =>
    worker.fetch(new Request(`${BASE}${p}`, init), env, {} as any);

  // ── sign up the owner ───────────────────────────────────────────
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

  const owner = await signUp("studio.owner@relo.test");
  const auth = { Authorization: `Bearer ${owner.token}` };
  const now = Math.floor(Date.now() / 1000);

  const seedAccount = (
    id: string,
    igId: string,
    username: string,
    plan: string
  ) =>
    sqlite
      .prepare(
        `INSERT INTO connected_accounts
          (id, user_id, instagram_user_id, username, profile_picture_url,
           access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan, ai_credits_remaining)
         VALUES (?, ?, ?, ?, NULL, 'enc', ?, 1, ?, ?, ?, ?)`
      )
      .run(id, owner.userId, igId, username, now + 5184000, now, now, plan, 500);

  const studioAccountId = "acc_p9_studio";
  const proAccountId = "acc_p9_pro";
  const freeAccountId = "acc_p9_free";
  seedAccount(studioAccountId, "ig_studio_1", "studio.creator", "studio");
  seedAccount(proAccountId, "ig_pro_1", "pro.creator", "pro");
  seedAccount(freeAccountId, "ig_free_1", "free.creator", "free");

  // Seed leads: one fresh, one whose 24h window has already closed.
  const seedLead = (
    id: string,
    scopedId: string,
    username: string,
    accountId: string,
    ageSeconds: number
  ) => {
    const t = now - ageSeconds;
    sqlite
      .prepare(
        `INSERT INTO captured_leads
          (id, account_id, instagram_scoped_id, username, follower_status_at_trigger,
           total_dms_sent, first_interaction_at, last_interaction_at, last_inbound_at)
         VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)`
      )
      .run(id, accountId, scopedId, username, t, t, t);
  };
  seedLead("lead_fresh_1", "igscoped_fresh_1", "fresh.lead", proAccountId, 600); // 10 min ago
  seedLead("lead_fresh_2", "igscoped_fresh_2", "second.lead", proAccountId, 1200); // 20 min ago
  seedLead("lead_stale_1", "igscoped_stale_1", "stale.lead", proAccountId, 60 * 60 * 26); // 26h ago

  const authJson = (path: string, method: string, body: unknown) =>
    req(path, {
      method,
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  // ═══════════════════════════════════════════════════════════════
  // 2. Tier matrix — the source of truth (plan.md §3)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[2] Tier limits encode the plan.md §3 matrix...");
  assert.strictEqual(limitsFor("free").maxAccounts, 1, "Free connects 1 IG account");
  assert.strictEqual(limitsFor("pro").maxAccounts, 1, "Pro connects 1 IG account");
  assert.strictEqual(limitsFor("studio").maxAccounts, 3, "Studio connects 3 IG accounts");
  assert.strictEqual(limitsFor("free").canvas, false, "Canvas is not a Free feature");
  assert.strictEqual(limitsFor("pro").canvas, false, "Canvas is not a Pro feature");
  assert.strictEqual(limitsFor("studio").canvas, true, "Canvas is a Studio feature");
  assert.strictEqual(limitsFor("studio").queuePriority, "priority");
  assert.strictEqual(limitsFor("free").queuePriority, "normal");
  assert.strictEqual(limitsFor("free").maxVariations, 2, "Free stays pinned at 2 variations");
  assert.strictEqual(limitsFor("studio").aiCredits, 5000);
  assert.ok(planSatisfies("studio", "pro"), "Studio satisfies a Pro gate");
  assert.ok(!planSatisfies("pro", "studio"), "Pro does not satisfy a Studio gate");
  assert.strictEqual(limitsFor("nonsense").maxAccounts, 1, "unknown plans fall back to Free");
  assert.strictEqual(Object.keys(TIER_LIMITS).length, 3);
  console.log("   ✓ Tier matrix matches plan.md §3 exactly.");

  // ═══════════════════════════════════════════════════════════════
  // 3. Campaign tier gate
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[3] Free tier is locked out of campaigns...");
  const freeGet = await authJson(
    `/api/campaigns?accountId=${freeAccountId}`,
    "GET",
    undefined
  );
  assert.strictEqual(freeGet.status, 403, "Free must get 403 reading campaigns");
  const freeGetJson: any = await freeGet.json();
  assert.strictEqual(freeGetJson.error.code, "CAMPAIGNS_LOCKED");
  assert.strictEqual(freeGetJson.error.details.upgrade, true);

  const freePost = await authJson("/api/campaigns", "POST", {
    accountId: freeAccountId,
    mediaId: "media_1",
    text: "Hey!",
  });
  assert.strictEqual(freePost.status, 403, "Free must get 403 creating campaigns");

  const proGet = await authJson(`/api/campaigns?accountId=${proAccountId}`, "GET", undefined);
  assert.strictEqual(proGet.status, 200, "Pro can read campaigns");
  console.log("   ✓ CAMPAIGNS_LOCKED + upgrade flag on Free read and write; Pro allowed.");

  // ═══════════════════════════════════════════════════════════════
  // 4. Reachability engine — the 24h window (plan.md §4.3)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[4] Reachability engine splits fresh leads from window-expired ones...");
  const created = await authJson("/api/campaigns", "POST", {
    accountId: proAccountId,
    mediaId: "media_reel_1",
    text: "Hey {username}! New drop just landed.",
    status: "scheduled",
  });
  assert.strictEqual(created.status, 201);
  const createdJson: any = await created.json();
  const campaignId = createdJson.data.campaign.id as string;
  assert.strictEqual(createdJson.data.reachability.total, 3, "3 captured leads on this account");
  assert.strictEqual(
    createdJson.data.reachability.reachable,
    2,
    "only the 2 leads inside the 24h window are sendable"
  );
  assert.strictEqual(
    createdJson.data.reachability.unreachable,
    1,
    "the 26-hour-old lead is outside Meta's window"
  );

  const detail = await authJson(
    `/api/campaigns/${campaignId}?accountId=${proAccountId}`,
    "GET",
    undefined
  );
  const detailJson: any = await detail.json();
  const unreachable = detailJson.data.targets.filter((t: any) => t.status === "unreachable");
  assert.strictEqual(unreachable.length, 1);
  assert.strictEqual(
    unreachable[0].failureReason,
    "window_expired",
    "an expired lead must say WHY it was skipped"
  );
  console.log('   ✓ "X of Y still reachable", and skipped leads carry a window_expired reason.');

  // ═══════════════════════════════════════════════════════════════
  // 5. Campaign validation + HUMAN_AGENT tag
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[5] Campaign payloads validate and carry the HUMAN_AGENT tag...");
  const noText = await authJson("/api/campaigns", "POST", {
    accountId: proAccountId,
    mediaId: "media_reel_1",
  });
  assert.strictEqual(noText.status, 400, "an empty message is rejected");

  const noMedia = await authJson("/api/campaigns", "POST", {
    accountId: proAccountId,
    text: "Hello",
  });
  assert.strictEqual(noMedia.status, 400, "a campaign must name its reel");

  const tagged = await authJson("/api/campaigns", "POST", {
    accountId: proAccountId,
    mediaId: "media_reel_1",
    text: "Human here — just checking in.",
    usesHumanAgentTag: true,
  });
  const taggedJson: any = await tagged.json();
  assert.strictEqual(
    taggedJson.data.campaign.usesHumanAgentTag,
    true,
    "the 7-day HUMAN_AGENT window is opt-in and must persist"
  );

  const tagCheck = applyHumanAgentTag(
    { recipient: { id: "x" }, message: { text: "hi" } },
    { usesHumanAgentTag: true } as any
  );
  assert.strictEqual((tagCheck.message as any).tag, "HUMAN_AGENT", "tag must reach the API payload");
  const noTagCheck = applyHumanAgentTag(
    { recipient: { id: "x" }, message: { text: "hi" } },
    { usesHumanAgentTag: false } as any
  );
  assert.strictEqual((noTagCheck.message as any).tag, undefined, "no tag unless asked");

  const templated = buildCampaignMessage(
    {
      payload: {
        kind: "card",
        card: { title: "New drop", subtitle: "20% off today", buttons: [] },
      },
    } as any,
    "someone"
  );
  assert.ok("attachment" in templated.message, "a card campaign builds a template payload");
  const plain = buildCampaignMessage(
    { payload: { kind: "text", text: "Hi {username}" } } as any,
    "someone"
  );
  assert.strictEqual(
    (plain.message as any).text,
    "Hi @someone",
    "{username} must merge, or the blast reads as a broadcast"
  );

  assert.strictEqual(
    classifyCampaignFailure(new TokenExpiredError("gone", { code: 190, statusCode: 401 })),
    "token_dead"
  );
  assert.strictEqual(
    classifyCampaignFailure(
      new UserNotReachableError("nope", { code: 100, subcode: 2018001, statusCode: 400 })
    ),
    "window_expired"
  );
  assert.strictEqual(classifyCampaignFailure(new Error("network flake")), "retryable");
  console.log("   ✓ Tag applies only when opted in; failures classify into 3 buckets.");

  // ═══════════════════════════════════════════════════════════════
  // 6. Canvas flows — Studio only
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[6] Canvas Studio is Studio-only...");
  for (const [label, accountId] of [
    ["Free", freeAccountId],
    ["Pro", proAccountId],
  ] as const) {
    const r = await authJson(`/api/flows?accountId=${accountId}`, "GET", undefined);
    assert.strictEqual(r.status, 403, `${label} must get 403 on the canvas`);
    assert.strictEqual(((await r.json()) as any).error.code, "CANVAS_LOCKED");

    const w = await authJson("/api/flows", "POST", { accountId, name: "Sneaky flow" });
    assert.strictEqual(w.status, 403, `${label} must not be able to write a flow`);
  }

  const studioFlows = await authJson(`/api/flows?accountId=${studioAccountId}`, "GET", undefined);
  assert.strictEqual(studioFlows.status, 200, "Studio can list flows");

  const madeFlow = await authJson("/api/flows", "POST", {
    accountId: studioAccountId,
    name: "Welcome chain",
  });
  assert.strictEqual(madeFlow.status, 201);
  const madeJson: any = await madeFlow.json();
  const flowId = madeJson.data.flow.id as string;
  assert.strictEqual(
    madeJson.data.flow.graph.nodes.length,
    3,
    "a new flow opens with the starter trigger -> reply -> card chain"
  );

  // Save a valid graph, then assert an invalid one is rejected.
  const savedGraph = {
    nodes: [
      { id: "t", type: "trigger_comment", position: { x: 0, y: 0 }, config: { keywords: ["VIP"] } },
      { id: "a", type: "action_reply", position: { x: 300, y: 0 }, config: { text: "Hi" } },
      { id: "b", type: "action_dm_card", position: { x: 600, y: 0 }, config: {} },
    ],
    edges: [
      { id: "t>a", source: "t", target: "a" },
      { id: "a>b", source: "a", target: "b" },
    ],
  };
  const savedFlow = await authJson("/api/flows", "POST", {
    accountId: studioAccountId,
    id: flowId,
    name: "Renamed",
    graph: savedGraph,
    isPublished: true,
  });
  assert.strictEqual(savedFlow.status, 200);
  const savedJson: any = await savedFlow.json();
  assert.strictEqual(savedJson.data.flow.name, "Renamed");
  assert.strictEqual(savedJson.data.flow.isPublished, true);
  assert.strictEqual(savedJson.data.flow.graph.nodes.length, 3);

  const branched = await authJson("/api/flows", "POST", {
    accountId: studioAccountId,
    id: flowId,
    graph: {
      nodes: savedGraph.nodes,
      edges: [
        { id: "t>a", source: "t", target: "a" },
        { id: "t>b", source: "t", target: "b" },
      ],
    },
  });
  assert.strictEqual(branched.status, 400, "branching is not supported yet");
  assert.strictEqual(((await branched.json()) as any).error.code, "INVALID_FLOW");
  console.log("   ✓ Pro/Free get CANVAS_LOCKED; Studio can build, save and publish flows.");

  // ═══════════════════════════════════════════════════════════════
  // 7. Graph validation rules (plan.md §7 "linear chains first")
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[7] Linear-chain validation rejects the shapes the engine can't run...");
  assert.ok("graph" in validateFlowGraph(createStarterGraph()), "starter graph is valid");
  assert.ok("error" in validateFlowGraph(null), "a missing graph is rejected");
  assert.ok("error" in validateFlowGraph({ nodes: [], edges: [] }), "an empty flow is rejected");
  assert.ok("error" in validateFlowGraph({ nodes: [{ id: "a", type: "unknown_type" }], edges: [] }));
  assert.ok(
    "error" in validateFlowGraph({
      nodes: [{ id: "a", type: "action_reply" }],
      edges: [],
    }),
    "a flow with no trigger is rejected"
  );
  assert.ok(
    "error" in validateFlowGraph({
      nodes: [
        { id: "t1", type: "trigger_comment" },
        { id: "t2", type: "trigger_comment" },
      ],
      edges: [],
    }),
    "two triggers are rejected"
  );
  const loopResult = validateFlowGraph({
    nodes: [
      { id: "t", type: "trigger_comment" },
      { id: "a", type: "action_reply" },
      { id: "b", type: "action_reply" },
    ],
    edges: [
      { id: "t>a", source: "t", target: "a" },
      { id: "a>b", source: "a", target: "b" },
      { id: "b>a", source: "b", target: "a" },
    ],
  });
  assert.ok("error" in loopResult, "a loop is rejected rather than hanging the worker");
  assert.ok(
    "error" in validateFlowGraph({
      nodes: [
        { id: "t", type: "trigger_comment" },
        { id: "orphan", type: "action_reply" },
      ],
      edges: [],
    }),
    "an unconnected step is rejected"
  );
  const chain = validateFlowGraph({
    nodes: [
      { id: "t", type: "trigger_comment", position: { x: 10.6, y: -3.2 } },
      { id: "a", type: "action_reply" },
    ],
    edges: [{ source: "t", target: "a" }],
  });
  assert.ok("graph" in chain, "a valid chain passes");
  assert.strictEqual(
    (chain as any).graph.nodes[0].position.x,
    11,
    "positions are rounded so the canvas can't be fed NaN"
  );
  assert.strictEqual(
    (chain as any).graph.edges[0].id,
    "t->a",
    "edges without an id get a derived one"
  );
  console.log("   ✓ Triggers, loops, branches, orphans, unknown types all rejected.");

  // ═══════════════════════════════════════════════════════════════
  // 8. Priority queue — Studio jumps the cron batch (plan.md §5)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[8] Studio jobs are ordered ahead of Free/Pro in the cron batch...");
  const seedJob = (id: string, accountId: string, sendAt: number) =>
    sqlite
      .prepare(
        `INSERT INTO jobs
          (id, account_id, comment_id, commenter_user_id, commenter_username,
           comment_text, post_id, matched_automation_id, status, retry_count, send_at,
           created_at, updated_at, is_follow_up)
         VALUES (?, ?, ?, ?, 'someone', 'VIP', 'post_1', NULL, 'pending', 0, ?, ?, ?, 0)`
      )
      .run(id, accountId, `c_${id}`, `u_${id}`, sendAt, now, now);

  // The Studio job is the NEWEST of the three. With plain send_at ordering it
  // would be dispatched last — priority ordering must move it first.
  seedJob("job_free", freeAccountId, now - 300);
  seedJob("job_pro", proAccountId, now - 200);
  seedJob("job_studio", studioAccountId, now - 100);

  const { getDueJobsBatch } = await import("../src/db/queries");
  const batch = await getDueJobsBatch(mockDb, 10);
  const order = batch.map((j) => String(j.id));
  assert.strictEqual(order[0], "job_studio", "the Studio job must lead the batch");
  assert.strictEqual(
    order[1],
    "job_free",
    "the rest keep strict send_at order among themselves (oldest first)"
  );
  assert.strictEqual(order[2], "job_pro");

  // And a downgrade takes effect immediately: the tier is read live, never
  // denormalised onto the job row.
  sqlite.prepare(`UPDATE connected_accounts SET plan = 'free' WHERE id = ?`).run(studioAccountId);
  const afterDowngrade = await getDueJobsBatch(mockDb, 10);
  const afterOrder = afterDowngrade.map((j) => String(j.id));
  assert.strictEqual(
    afterOrder[0],
    "job_free",
    "after a downgrade the old Studio job loses its place"
  );
  sqlite.prepare(`UPDATE connected_accounts SET plan = 'studio' WHERE id = ?`).run(studioAccountId);
  console.log("   ✓ Studio first regardless of send_at; downgrade takes effect on the next tick.");

  // ═══════════════════════════════════════════════════════════════
  // 9. Referrals (plan.md §7)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[9] Referral codes are deterministic and self-referral is refused...");
  const code = makeReferralCode(owner.userId);
  assert.strictEqual(code, makeReferralCode(owner.userId), "same user, same code");
  assert.notStrictEqual(code, makeReferralCode("someone-else-1234"), "codes differ per user");
  assert.ok(/^[A-Z0-9]{1,8}$/.test(code), "codes are URL-safe and short");

  const summaryRes = await authJson("/api/referrals", "GET", undefined);
  const summaryJson: any = await summaryRes.json();
  assert.strictEqual(summaryJson.data.referral.code, code);
  assert.ok(
    String(summaryJson.data.referral.shareUrl).includes(`ref=${code}`),
    "the share URL carries the code"
  );
  assert.strictEqual(summaryJson.data.referral.rewardMonthsEarned, 0);

  const friend = await signUp("friend@relo.test");
  const friendAuth = { Authorization: `Bearer ${friend.token}` };
  const claim = await worker.fetch(
    new Request(`${BASE}/api/referrals`, {
      method: "POST",
      headers: { ...friendAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }),
    env,
    {} as any
  );
  assert.strictEqual(claim.status, 200);
  assert.strictEqual(((await claim.json()) as any).data.recorded, true, "a friend's claim records");

  const selfClaim = await worker.fetch(
    new Request(`${BASE}/api/referrals`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }),
    env,
    {} as any
  );
  assert.strictEqual(selfClaim.status, 200);
  assert.strictEqual(
    ((await selfClaim.json()) as any).data.recorded,
    false,
    "self-referral must not count, and must not be distinguishable from a repeat claim"
  );

  const bogus = await worker.fetch(
    new Request(`${BASE}/api/referrals`, {
      method: "POST",
      headers: { ...friendAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ code: "NOTACODE" }),
    }),
    env,
    {} as any
  );
  assert.strictEqual(bogus.status, 400, "an unknown code is rejected");

  const afterClaim: any = await (
    await authJson("/api/referrals", "GET", undefined)
  ).json();
  assert.strictEqual(afterClaim.data.referral.referredCount, 1, "one referral, unpaid");
  assert.strictEqual(
    afterClaim.data.referral.rewardMonthsEarned,
    0,
    "a signup that has not paid earns nothing yet"
  );

  // The reward only lands when the referred person actually activates a plan.
  // Give the friend an account of their own, then pay for THAT account — the
  // owner's own upgrade must not qualify somebody else's referral.
  sqlite
    .prepare(
      `INSERT INTO connected_accounts
        (id, user_id, instagram_user_id, username, profile_picture_url,
         access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan, ai_credits_remaining)
       VALUES ('acc_p9_friend', ?, 'ig_friend_1', 'friend.creator', NULL, 'enc', ?, 1, ?, ?, 'free', 3)`
    )
    .run(friend.userId, now + 5184000, now, now);

  sqlite
    .prepare(
      `INSERT INTO payments (id, account_id, provider, plan, amount_inr, utr, status)
       VALUES ('pay_owner_early', ?, 'manual_upi', 'pro', 149, 'UTROWNER01', 'pending')`
    )
    .run(freeAccountId);
  const ownerPaid = await worker.fetch(
    new Request(`${BASE}/api/admin/activate-payment`, {
      method: "POST",
      headers: {
        ...auth,
        "x-admin-secret": "admin_test_secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId: "pay_owner_early", approve: true }),
    }),
    env,
    {} as any
  );
  const ownerPaidJson: any = await ownerPaid.json();
  assert.strictEqual(ownerPaidJson.data.referralsRewarded, 0, "owner's own payment rewards nobody");

  const stillUnpaid: any = await (await authJson("/api/referrals", "GET", undefined)).json();
  assert.strictEqual(
    stillUnpaid.data.referral.rewardMonthsEarned,
    0,
    "an unpaid referral earns nothing"
  );

  sqlite
    .prepare(
      `INSERT INTO payments (id, account_id, provider, plan, amount_inr, utr, status)
       VALUES ('pay_p9', 'acc_p9_friend', 'manual_upi', 'pro', 149, 'UTRPHASE9', 'pending')`
    )
    .run();
  const activated = await worker.fetch(
    new Request(`${BASE}/api/admin/activate-payment`, {
      method: "POST",
      headers: {
        ...auth,
        "x-admin-secret": "admin_test_secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId: "pay_p9", approve: true }),
    }),
    env,
    {} as any
  );
  const activatedJson: any = await activated.json();
  assert.strictEqual(
    activatedJson.data.referralsRewarded,
    1,
    "the referred person's first paid activation earns the reward"
  );

  const afterPay: any = await (await authJson("/api/referrals", "GET", undefined)).json();
  assert.strictEqual(afterPay.data.referral.referredCount, 1);
  assert.strictEqual(afterPay.data.referral.qualifiedCount, 1);
  assert.strictEqual(
    afterPay.data.referral.rewardMonthsEarned,
    1,
    "one free month of Pro per qualified referral"
  );

  // Paying twice must not pay twice.
  sqlite
    .prepare(
      `INSERT INTO payments (id, account_id, provider, plan, amount_inr, utr, status)
       VALUES ('pay_p9_again', 'acc_p9_friend', 'manual_upi', 'pro', 149, 'UTRPHASE99', 'pending')`
    )
    .run();
  await worker.fetch(
    new Request(`${BASE}/api/admin/activate-payment`, {
      method: "POST",
      headers: {
        ...auth,
        "x-admin-secret": "admin_test_secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId: "pay_p9_again", approve: true }),
    }),
    env,
    {} as any
  );
  const afterRenewal: any = await (await authJson("/api/referrals", "GET", undefined)).json();
  assert.strictEqual(
    afterRenewal.data.referral.rewardMonthsEarned,
    1,
    "a renewal must not re-award the referral bonus"
  );
  console.log("   ✓ Codes deterministic, self-claim refused, reward pays once on real payment.");

  // ═══════════════════════════════════════════════════════════════
  // 10. Agency intake (plan.md §3 — "bigger than 3 accounts")
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[10] Agency contact is captured for the owner...");
  const agency = await authJson("/api/agency/contact", "POST", {
    accountCount: 12,
    notes: "We run 14 client pages.",
  });
  assert.strictEqual(agency.status, 200, "an agency enquiry is accepted");
  const agencyJson: any = await agency.json();
  assert.ok(
    String(agencyJson.data.message).includes("studio.owner@relo.test"),
    "the confirmation names the address the owner will reply to"
  );
  const logged = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM webhook_logs WHERE event_type = 'agency_contact'`)
    .get() as any;
  assert.strictEqual(Number(logged.n), 1, "the enquiry is recorded for the owner to work");

  const badEmail = await authJson("/api/agency/contact", "POST", {
    email: "not-an-email",
  });
  assert.strictEqual(badEmail.status, 400, "a malformed email is rejected");
  console.log("   ✓ Agency enquiries recorded; bad input rejected.");

  // ═══════════════════════════════════════════════════════════════
  // 11. Ownership isolation on the new surfaces
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[11] Cross-account access to Phase 3 surfaces is refused...");
  const stranger = await signUp("stranger@relo.test");
  const strangerAuth = { Authorization: `Bearer ${stranger.token}` };
  for (const [p, m, body] of [
    [`/api/campaigns/${campaignId}?accountId=${proAccountId}`, "GET", undefined],
    [`/api/campaigns/${campaignId}?accountId=${proAccountId}`, "DELETE", undefined],
    [`/api/flows?accountId=${studioAccountId}`, "GET", undefined],
    [`/api/campaigns?accountId=${proAccountId}`, "GET", undefined],
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

  // Cross-account flow delete must not touch the row either.
  await worker.fetch(
    new Request(`${BASE}/api/flows/${flowId}?accountId=${proAccountId}`, {
      method: "DELETE",
      headers: { ...strangerAuth },
    }),
    env,
    {} as any
  );
  const flowStillThere = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM flows WHERE id = ?`)
    .get(flowId) as any;
  assert.strictEqual(Number(flowStillThere.n), 1, "the flow survives a stranger's delete");
  console.log("   ✓ Non-owners get an opaque 404 on every Phase 3 surface.");

  console.log("\n🎉 ALL PHASE 9 POWER & SCALE TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("\n✗ PHASE 9 TESTS FAILED");
  console.error(err);
  process.exit(1);
});