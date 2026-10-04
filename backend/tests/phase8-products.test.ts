/**
 * Phase 8 test suite — PRODUCTS LIBRARY (plan.md §4.4)
 *
 * Covers the foundations the rest of Phase 2 stands on:
 *   • tier gating — Free accounts are locked out of the library entirely
 *   • CRUD — create, list, update, delete, all scoped to the owning account
 *   • the 50-product cap that keeps the catalog inside one AI prompt
 *   • URL safety — javascript:/data: links must never persist
 *
 * Runs against the same in-memory SQLite D1 mock as the other suites, so it
 * exercises the real schema.sql and the real router, not a hand-mocked DB.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../src/db";
import worker from "../src/index";
import { signJwt } from "../src/auth";

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
  console.log("=== RUNNING PHASE 8 PRODUCTS LIBRARY TEST SUITE ===");

  console.log("\n[1] Initializing D1 in-memory database with schema.sql...");
  const sqlite = new DatabaseSync(":memory:");
  const schemaPath = path.join(__dirname, "../schema.sql");
  sqlite.exec(fs.readFileSync(schemaPath, "utf-8"));
  const mockDb = createMockD1(sqlite);

  const env = {
    DB: mockDb,
    ENVIRONMENT: "test",
    JWT_SECRET: "test_secret_phase8_32_bytes_super_secure!",
    ENCRYPTION_MASTER_KEY: "test_master_encryption_key_32_bytes!",
    DEBUG_OTPS: "1", // test env echoes the OTP so the flow can be asserted
    ADMIN_SECRET: "admin_test_secret",
  } as unknown as Env;

  // ── seed: user + a Pro account and a Free account ──────────────
  const email = "shop@relo.test";
  const otpSend = await worker.fetch(
    new Request(`${BASE}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
    env,
    {} as any
  );
  const otpCode = (await (otpSend as any).json()).data.debugCode;
  const verify = await worker.fetch(
    new Request(`${BASE}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otpCode }),
    }),
    env,
    {} as any
  );
  const verifyJson: any = await verify.json();
  const userToken = verifyJson.data.token;
  assert.ok(userToken, "must receive a JWT after OTP verify");
  const auth = { Authorization: `Bearer ${userToken}` };

  const proAccountId = "acc_phase8_pro";
  const freeAccountId = "acc_phase8_free";
  const now = Math.floor(Date.now() / 1000);
  const seedAccount = (id: string, igId: string, username: string, plan: string, credits: number) =>
    sqlite
      .prepare(
        `INSERT INTO connected_accounts
          (id, user_id, instagram_user_id, username, profile_picture_url,
           access_token_encrypted, token_expires_at, is_active, created_at, updated_at, plan, ai_credits_remaining)
         VALUES (?, ?, ?, ?, NULL, 'enc', ?, 1, ?, ?, ?, ?)`
      )
      .run(id, verifyJson.data.user.id, igId, username, now + 5184000, now, now, plan, credits);
  seedAccount(proAccountId, "ig_shop_1", "pro.shop", "pro", 500);
  seedAccount(freeAccountId, "ig_free_1", "free.creator", "free", 3);

  const req = (path: string, init: RequestInit = {}) =>
    worker.fetch(new Request(`${BASE}${path}`, init), env, {} as any);

  // ── 2. Free tier is locked out entirely ─────────────────────────
  console.log("\n[2] Free tier cannot read or write the products library...");
  const freeGet = await req(`/api/products?accountId=${freeAccountId}`, { headers: auth });
  assert.strictEqual(freeGet.status, 403, "Free must get 403 on GET");
  const freeGetJson: any = await freeGet.json();
  assert.strictEqual(freeGetJson.success, false);
  assert.strictEqual(freeGetJson.error.code, "PRODUCTS_LOCKED");
  assert.strictEqual(freeGetJson.error.details.upgrade, true, "must flag the upsell");

  const freePost = await req("/api/products", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ accountId: freeAccountId, name: "Sneak" }),
  });
  assert.strictEqual(freePost.status, 403, "Free must get 403 on POST");

  console.log("   ✓ Free tier locked with PRODUCTS_LOCKED + upgrade flag on both read and write.");

  // ── 3. Pro CRUD round-trip ──────────────────────────────────────
  console.log("\n[3] Pro account: create, list, update, delete...");
  const created = await req("/api/products", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: proAccountId,
      name: "Growth Blueprint",
      priceText: "₹499",
      description: "12 proven DM funnels with templates.",
      link: "https://pro.shop/blueprint",
    }),
  });
  assert.strictEqual(created.status, 201, "create must return 201");
  const createdJson: any = await created.json();
  assert.strictEqual(createdJson.data.product.name, "Growth Blueprint");
  assert.strictEqual(createdJson.data.product.isActive, true);
  assert.ok(createdJson.data.product.id, "must have an id");
  const productId = createdJson.data.product.id as string;

  const listed = await req(`/api/products?accountId=${proAccountId}`, { headers: auth });
  const listedJson: any = await listed.json();
  assert.strictEqual(listedJson.data.products.length, 1);
  assert.strictEqual(listedJson.data.products[0].link, "https://pro.shop/blueprint");

  const updated = await req("/api/products", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: proAccountId,
      id: productId,
      name: "Growth Blueprint v2",
      priceText: "₹699",
      isActive: false,
    }),
  });
  const updatedJson: any = await updated.json();
  assert.strictEqual(updatedJson.data.product.name, "Growth Blueprint v2");
  assert.strictEqual(updatedJson.data.product.isActive, false, "pause must persist");

  const removed = await req(
    `/api/products/${productId}?accountId=${proAccountId}`,
    { method: "DELETE", headers: auth }
  );
  assert.strictEqual(removed.status, 200);
  const afterDelete = await req(`/api/products?accountId=${proAccountId}`, { headers: auth });
  assert.strictEqual(((await afterDelete.json()) as any).data.products.length, 0);

  console.log("   ✓ Create → list → update → delete, all scoped to the owning account.");

  // ── 4. The 50-product cap ───────────────────────────────────────
  console.log("\n[4] Catalog capped at 50 so it fits one AI prompt...");
  for (let i = 0; i < 50; i++) {
    const r = await req("/api/products", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: proAccountId, name: `Product ${i + 1}` }),
    });
    assert.strictEqual(r.status, 201, `insert ${i + 1} should succeed`);
  }
  const over = await req("/api/products", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ accountId: proAccountId, name: "One too many" }),
  });
  assert.strictEqual(over.status, 403, "51st product must be rejected");
  assert.strictEqual(((await over.json()) as any).error.code, "PRODUCT_LIMIT");
  console.log("   ✓ 50 inserted, 51st rejected with PRODUCT_LIMIT.");

  // ── 5. URL safety ───────────────────────────────────────────────
  console.log("\n[5] Dangerous URLs must never persist...");
  // free a slot first
  sqlite.prepare(`DELETE FROM products WHERE account_id = ?`).run(proAccountId);
  const sneaky = await req("/api/products", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: proAccountId,
      name: "XSS attempt",
      link: "javascript:alert(1)",
      imageUrl: "data:text/html;base64,PHNjcmlwdD4=",
    }),
  });
  assert.strictEqual(sneaky.status, 201, "the product itself is still creatable");
  const sneakyJson: any = await sneaky.json();
  assert.strictEqual(sneakyJson.data.product.link, undefined, "javascript: link must be dropped");
  assert.strictEqual(sneakyJson.data.product.imageUrl, undefined, "data: image must be dropped");
  console.log("   ✓ javascript:/data: URLs stripped, product saved without them.");

  // ── 6. Cross-account isolation ──────────────────────────────────
  console.log("\n[6] One account cannot read or delete another's products...");
  const seeded = await req("/api/products", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ accountId: proAccountId, name: "Pro only" }),
  });
  const seededId = ((await seeded.json()) as any).data.product.id as string;
  // Free account's GET is blocked by tier, so probe isolation via delete
  const crossDelete = await req(
    `/api/products/${seededId}?accountId=${freeAccountId}`,
    { method: "DELETE", headers: auth }
  );
  // The delete is scoped by account_id, so it reports 404 — deliberately
  // opaque, rather than 403, which would confirm the row exists to an attacker.
  assert.ok(
    crossDelete.status === 404 || crossDelete.status === 403,
    `cross-account delete must be refused (got ${crossDelete.status})`
  );
  const stillThere = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM products WHERE id = ?`)
    .get(seededId) as any;
  assert.strictEqual(Number(stillThere.n), 1, "row must survive the cross-account attempt");
  // And the legitimate owner can still delete it.
  const ownerDelete = await req(
    `/api/products/${seededId}?accountId=${proAccountId}`,
    { method: "DELETE", headers: auth }
  );
  assert.strictEqual(ownerDelete.status, 200, "owner must still be able to delete");
  console.log("   ✓ Cross-account delete refused (opaque), row intact, owner can delete.");

  console.log("\n🎉 ALL PHASE 8 PRODUCTS LIBRARY TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("\n✗ PHASE 8 TESTS FAILED");
  console.error(err);
  process.exit(1);
});
