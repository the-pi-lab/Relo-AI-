import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { pgUrl, ensureDb } from "./helpers.js";
import { query } from "../src/db.js";
import { reserveSendSlot } from "../src/ratelimit.js";

if (!pgUrl()) {
  it("pg-backed ratelimit tests (skipped: TEST_DATABASE_URL not set)", () => {});
} else {
  describe("ratelimit (Postgres)", () => {
    before(async () => {
      process.env.RATE_LIMIT_MAX = "2";
      await ensureDb();
    });

    it("allows up to the cap, then blocks with retryAfterMs", async () => {
      await ensureDb();
      assert.deepEqual((await reserveSendSlot("ACC-A")).allowed, true);
      assert.deepEqual((await reserveSendSlot("ACC-A")).allowed, true);
      const blocked = await reserveSendSlot("ACC-A");
      assert.equal(blocked.allowed, false);
      assert.ok(blocked.retryAfterMs > 0);
    });

    it("tracks accounts independently", async () => {
      await ensureDb();
      await reserveSendSlot("ACC-A");
      await reserveSendSlot("ACC-A");
      assert.equal((await reserveSendSlot("ACC-A")).allowed, false);
      assert.equal((await reserveSendSlot("ACC-B")).allowed, true);
    });

    it("resets when the hourly window expires", async () => {
      await ensureDb();
      await reserveSendSlot("ACC-A");
      await reserveSendSlot("ACC-A");
      assert.equal((await reserveSendSlot("ACC-A")).allowed, false);
      await query("UPDATE rate_counters SET window_start = now() - INTERVAL '2 hours' WHERE account_id = 'ACC-A'");
      assert.equal((await reserveSendSlot("ACC-A")).allowed, true);
    });
  });
}
