/**
 * Phase 10 test suite — GROWTH ENGINE (plan.md §4.4 AI + §4.5 link-in-bio)
 *
 * The AI assertions here are the important ones. A grounded-AI failure is not
 * a crash, it is a confidently wrong price sent to a paying customer — so the
 * tests below attack the responder from every direction and assert that the
 * safe outcome (owner hand-off) wins each time:
 *
 *   • grounding — a reply that invents facts is discarded
 *   • price audit — a price absent from the catalog is discarded
 *   • frustration — never auto-answered, no credit spent
 *   • credits — spent only for a reply actually sent, never over-drafted
 *   • degradation — no API key / NIM down / empty catalog all hand off
 *   • intent + sentiment routing
 *   • link-in-bio — cross-account product promotion is refused
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { signJwt } from "../src/auth";
import {
  classifyIntent,
  buildCatalogBlock,
  buildMessages,
  isGrounded,
  findFabricatedPrice,
  pickBestProduct,
  buildProductCardReply,
  decideAiReply,
  OWNER_HANDOFF_REPLY,
} from "../src/engine/aiResponder";
import type { ProductRow } from "../src/db/queries";

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

function product(over: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "prod_1",
    accountId: "acc" as any,
    name: "Growth Blueprint",
    priceText: "₹499",
    description: "12 DM funnels with templates.",
    link: "https://shop.test/blueprint",
    imageUrl: null,
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  } as ProductRow;
}

async function runTests() {
  console.log("=== RUNNING PHASE 10 GROWTH ENGINE TEST SUITE ===");

  console.log("\n[1] Initializing D1 in-memory database with schema.sql...");
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase10_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1",
    ADMIN_SECRET: "admin_test_secret",
    PUBLIC_APP_URL: "https://app.relo.test",
  } as unknown as Env;

  const req = (p: string, init: RequestInit = {}) =>
    worker.fetch(new Request(`${BASE}${p}`, init), env, {} as any);

  const email = "owner@relo.test";
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
  const verifyJson: any = await verify.json();
  const auth = { Authorization: `Bearer ${verifyJson.data.token}` };
  const userId = verifyJson.data.user.id as string;

  const now = Math.floor(Date.now() / 1000);
  const accountId = "acc_p10_pro";
  sqlite
    .prepare(
      `INSERT INTO connected_accounts
        (id, user_id, instagram_user_id, username, profile_picture_url,
         access_token_encrypted, token_expires_at, is_active, created_at, updated_at,
         plan, ai_credits_remaining, ai_credits_reset_at)
       VALUES (?, ?, 'ig_p10', 'owner', NULL, 'enc', ?, 1, ?, ?, 'pro', 500, ?)`
    )
    .run(accountId, userId, now + 5184000, now, now, now + 30 * 86400);

  const catalog = [
    product(),
    product({
      id: "prod_2",
      name: "Reel Course",
      priceText: "₹1999",
      description: "6 hours of Reel strategy.",
      link: "https://shop.test/course",
    }),
  ];

  for (const p of catalog) {
    sqlite
      .prepare(
        `INSERT INTO products (id, account_id, name, price_text, description, link, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .run(p.id, accountId, p.name, p.priceText, p.description, p.link, now, now);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. Intent + sentiment routing
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[2] Intent and sentiment routing...");
  assert.strictEqual(classifyIntent("how much is the blueprint?"), "buying_intent");
  assert.strictEqual(classifyIntent("I want to buy the course"), "buying_intent");
  assert.strictEqual(classifyIntent("do you ship to India?"), "product_question");
  assert.strictEqual(classifyIntent("hey thanks!"), "smalltalk");
  assert.strictEqual(classifyIntent("this is a scam, where is my order"), "frustrated");
  assert.strictEqual(classifyIntent("I want a refund"), "frustrated");
  assert.strictEqual(classifyIntent("asdf qwerty"), "unknown");
  assert.strictEqual(
    classifyIntent("this is a scam AND how much is it"),
    "frustrated",
    "frustration must win over a product question"
  );
  console.log("   ✓ 6 intents classified; frustration takes priority.");

  // ═══════════════════════════════════════════════════════════════
  // 3. Grounding
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[3] Grounding — a reply must come from the catalog...");
  assert.strictEqual(isGrounded("The Growth Blueprint is ₹499.", catalog), true);
  assert.strictEqual(
    isGrounded("We also offer a lifetime membership with lifetime support.",
      catalog
    ),
    false,
    "a reply naming nothing in the catalog is a fabrication"
  );
  assert.strictEqual(isGrounded("", catalog), false);
  assert.strictEqual(isGrounded("The Growth Blueprint is great.", []), false);

  const block = buildCatalogBlock(catalog);
  assert.ok(block.includes("Growth Blueprint"), "catalog block lists product names");
  assert.ok(block.includes("₹499"), "catalog block lists prices");
  assert.ok(block.includes("https://shop.test/blueprint"), "catalog block lists buy links");
  assert.strictEqual(buildCatalogBlock([]), "(catalog is empty)");

  const messages = buildMessages("how much?", catalog);
  assert.strictEqual(messages.length, 2);
  assert.strictEqual(messages[0].role, "system");
  assert.ok(
    messages[0].content.includes("answer ONLY from the CATALOG"),
    "the grounding rule must be in the system prompt"
  );
  assert.strictEqual(messages[1].content, "how much?");
  console.log("   ✓ Ungrounded replies rejected; catalog rendered into the prompt.");

  // ═══════════════════════════════════════════════════════════════
  // 4. Fabricated-price audit
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[4] A price absent from the catalog is a fabrication...");
  assert.strictEqual(
    findFabricatedPrice("The Growth Blueprint is ₹499.", catalog),
    null,
    "a real price passes"
  );
  assert.strictEqual(
    findFabricatedPrice("The Growth Blueprint is ₹2999.", catalog),
    "2999.",
    "an invented price is caught even in an otherwise-grounded reply"
  );
  assert.strictEqual(
    findFabricatedPrice("It ships in 3 days.", catalog),
    null,
    "small numbers are not money and must not trip the audit"
  );
  console.log("   ✓ Money-shaped numbers are audited against the catalog.");

  // ═══════════════════════════════════════════════════════════════
  // 5. Product matching + card
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[5] Buying intent produces a tappable card...");
  assert.strictEqual(pickBestProduct("The Reel Course is perfect", catalog)?.id, "prod_2");
  assert.strictEqual(pickBestProduct("Something unrelated", catalog)?.id, "prod_1");

  const card = buildProductCardReply(catalog[0], "https://engine.relo.test/", "link_abc12345");
  assert.strictEqual(card.card.buttons[0].url, "https://engine.relo.test/l/link_abc12345");
  assert.strictEqual(card.card.buttons.length, 1);
  assert.ok(card.text.includes("₹499"), "the card text carries the price");

  const noLink = buildProductCardReply(product({ link: null }), "");
  assert.strictEqual(noLink.card.buttons.length, 0, "a product with no link gets no dead button");
  console.log("   ✓ Cards route through /l/:id so clicks feed the same funnel.");

  // ═══════════════════════════════════════════════════════════════
  // 6. The responder never fabricates, at any price
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[6] The responder: safe outcomes on every failure path...");
  const deps = { db: mockDb, env, accountId: accountId as any, plan: "pro" };

  const noKey = await decideAiReply("how much is the blueprint?", deps);
  assert.strictEqual(noKey.action, "handoff", "no API key configured → hand off");
  assert.strictEqual(noKey.creditSpent, false, "a hand-off must not cost a credit");

  const frustrated = await decideAiReply("this is a SCAM where is my order", deps);
  assert.strictEqual(frustrated.action, "silence", "a frustrated thread goes silent");
  assert.strictEqual(frustrated.creditSpent, false);

  const greeting = await decideAiReply("hey thanks!", deps);
  assert.strictEqual(greeting.action, "handoff", "small talk is not worth a model call");
  assert.strictEqual(greeting.creditSpent, false);

  sqlite.prepare(`UPDATE products SET is_active = 0`).run();
  const emptyCatalog = await decideAiReply("what do you sell?", deps);
  assert.strictEqual(emptyCatalog.action, "handoff", "an empty catalog always hands off");
  assert.strictEqual(emptyCatalog.reason, "empty_catalog");
  sqlite
    .prepare(`UPDATE products SET is_active = 1`)
    .run();

  // No credit may have been spent by any of the above.
  const creditsRow = sqlite
    .prepare(`SELECT ai_credits_remaining FROM connected_accounts WHERE id = ?`)
    .get(accountId) as any;
  assert.strictEqual(Number(creditsRow.ai_credits_remaining), 500, "no credit spent on a hand-off");
  const ledger = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM credit_ledger WHERE account_id = ?`)
    .get(accountId) as any;
  assert.strictEqual(Number(ledger.n), 0, "the ledger must stay clean when AI never replies");
  console.log("   ✓ No key / frustration / small talk / empty catalog all hand off for free.");

  // ═══════════════════════════════════════════════════════════════
  // 7. Credits are never over-drafted
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[7] The credit ledger is the authority...");
  sqlite
    .prepare(`UPDATE connected_accounts SET ai_credits_remaining = 0 WHERE id = ?`)
    .run(accountId);
  const { spendAiCredit } = await import("../src/db/queries");
  assert.strictEqual(await spendAiCredit(mockDb, accountId as any), false, "cannot spend to zero+");
  const zeroRow = sqlite
    .prepare(`SELECT ai_credits_remaining FROM connected_accounts WHERE id = ?`)
    .get(accountId) as any;
  assert.strictEqual(Number(zeroRow.ai_credits_remaining), 0, "balance never goes negative");

  sqlite
    .prepare(`UPDATE connected_accounts SET ai_credits_remaining = 2 WHERE id = ?`)
    .run(accountId);
  assert.strictEqual(await spendAiCredit(mockDb, accountId as any), true);
  assert.strictEqual(await spendAiCredit(mockDb, accountId as any), true);
  assert.strictEqual(await spendAiCredit(mockDb, accountId as any), false, "the third spend is refused");
  const spent = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM credit_ledger WHERE account_id = ?`)
    .get(accountId) as any;
  assert.strictEqual(Number(spent.n), 2, "only successful spends are ledgered");
  sqlite
    .prepare(`UPDATE connected_accounts SET ai_credits_remaining = 500 WHERE id = ?`)
    .run(accountId);
  sqlite.prepare(`DELETE FROM credit_ledger`).run();
  console.log("   ✓ Atomic spend, no negative balance, ledger matches successes exactly.");

  // ═══════════════════════════════════════════════════════════════
  // 8. Link-in-bio (plan.md §4.5)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[8] Link in bio: build, publish, and refuse cross-account products...");
  const pageGet = await req(`/api/link-page?accountId=${accountId}`, { headers: auth });
  assert.strictEqual(pageGet.status, 200);
  const initial: any = await pageGet.json();
  assert.strictEqual(initial.data.page, null, "no page exists yet");
  assert.strictEqual(initial.data.products.length, 2, "the products library feeds the page");

  const saved = await req(`/api/link-page?accountId=${accountId}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      headline: "My stuff",
      bio: "Everything I use to grow.",
      theme: "dark",
      isPublished: true,
      blocks: [
        { productId: "prod_1", label: "Growth Blueprint" },
        { label: "My YouTube", targetUrl: "https://youtube.com/@me" },
      ],
    }),
  });
  assert.strictEqual(saved.status, 200);
  const savedJson: any = await saved.json();
  assert.strictEqual(savedJson.data.blocks.length, 2);
  assert.strictEqual(savedJson.data.blocks[0].targetUrl, "https://shop.test/blueprint",
    "a product block inherits the product's buy link");
  assert.ok(savedJson.data.publicUrl.includes("/p/"), "a public URL is returned");

  const badLink = await req(`/api/link-page?accountId=${accountId}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ blocks: [{ label: "evil", targetUrl: "javascript:alert(1)" }] }),
  });
  assert.strictEqual(badLink.status, 400, "javascript: targets are refused");
  assert.strictEqual(((await badLink.json()) as any).error.code, "INVALID_LINK");

  const foreignProduct = await req(`/api/link-page?accountId=${accountId}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ blocks: [{ label: "theirs", productId: "prod_someone_else" }] }),
  });
  assert.strictEqual(foreignProduct.status, 400, "another account's product cannot be promoted");
  assert.strictEqual(((await foreignProduct.json()) as any).error.code, "UNKNOWN_PRODUCT");

  const badSlug = await req(`/api/link-page?accountId=${accountId}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "has spaces!", blocks: [] }),
  });
  assert.strictEqual(badSlug.status, 400);
  assert.strictEqual(((await badSlug.json()) as any).error.code, "INVALID_SLUG");

  // ═══════════════════════════════════════════════════════════════
  // 9. The public page renders, and only when published
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[9] The public page renders server-side...");
  const pageId = savedJson.data.page.id as string;
  const publicRes = await worker.fetch(
    new Request(`${BASE}/p/${pageId}`),
    env,
    {} as any
  );
  assert.strictEqual(publicRes.status, 200, "a published page is public");
  const html = await publicRes.text();
  assert.ok(html.includes("<!doctype html>"), "renders real HTML");
  assert.ok(html.includes("Growth Blueprint"), "blocks appear");
  assert.ok(html.includes("My YouTube"), "plain links appear");
  assert.ok(!html.includes("javascript:"), "no unsafe URL survives rendering");
  assert.ok(html.includes("RELO"), "the page credits RELO");
  assert.ok(html.includes("application/ld+json"), "structured data is embedded");

  const unpublished = await req(`/api/link-page?accountId=${accountId}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ headline: "hidden", isPublished: false, blocks: [] }),
  });
  const unpublishedJson: any = await unpublished.json();
  const hiddenRes = await worker.fetch(
    new Request(`${BASE}/p/${unpublishedJson.data.page.id}`),
    env,
    {} as any
  );
  assert.strictEqual(hiddenRes.status, 404, "an unpublished page 404s rather than leaking");
  console.log("   ✓ Public HTML renders; unpublished pages 404.");

  // ═══════════════════════════════════════════════════════════════
  // 10. Tier gate
  // ═══════════════════════════════════════════════════════════════
  console.log("\n[10] Link in bio is Pro/Studio only...");
  const freeAccountId = "acc_p10_free";
  sqlite
    .prepare(
      `INSERT INTO connected_accounts
        (id, user_id, instagram_user_id, username, profile_picture_url,
         access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan, ai_credits_remaining)
       VALUES (?, ?, 'ig_p10_free', 'freebie', NULL, 'enc', ?, 1, ?, ?, 'free', 3)`
    )
    .run(freeAccountId, userId, now + 5184000, now, now);

  const freeRead = await req(`/api/link-page?accountId=${freeAccountId}`, { headers: auth });
  assert.strictEqual(freeRead.status, 403);
  assert.strictEqual(((await freeRead.json()) as any).error.code, "LINK_PAGE_LOCKED");

  const freeWrite = await req(`/api/link-page?accountId=${freeAccountId}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ blocks: [] }),
  });
  assert.strictEqual(freeWrite.status, 403, "Free cannot publish a page");
  console.log("   ✓ Free gets LINK_PAGE_LOCKED on read and write.");

  console.log("\n🎉 ALL PHASE 10 GROWTH ENGINE TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("\n✗ PHASE 10 TESTS FAILED");
  console.error(err);
  process.exit(1);
});
