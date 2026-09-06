// End-to-end engine tests against a stubbed Meta API (no real network).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pgUrl, ensureDb } from "./helpers.js";
import { query } from "../src/db.js";
import { protectSecret } from "../src/crypto.js";
import { stats } from "../src/stats.js";
import { processCommentJob, processDmJob, RescheduleError } from "../src/engine.js";
import { RateLimitError } from "../src/meta.js";
import { startMetaStub } from "./meta-stub.js";

if (!pgUrl()) {
  it("pg-backed engine tests (skipped: TEST_DATABASE_URL not set)", () => {});
} else {
  describe("engine (stubbed Meta)", () => {
    let stub;

    before(async () => {
      stub = await startMetaStub();
      process.env.META_GRAPH_PROTOCOL = "http";
      process.env.META_GRAPH_HOST = `127.0.0.1:${stub.port}`;
      process.env.META_GRAPH_API_VERSION = "vtest";
      process.env.RATE_LIMIT_MAX = "750";
      await ensureDb();
    });

    after(async () => {
      await stub.close();
    });

    async function seed() {
      await ensureDb();
      stub.reset();
      stats.dmSent = 0;
      await query(
        "INSERT INTO ig_accounts (instagram_id, username, access_token) VALUES ('ACCT1', 'testuser', $1)",
        [protectSecret("stub-token")]
      );
    }

    async function addFlow(overrides = {}) {
      await query(
        `INSERT INTO flows (id, name, is_active, match_any_post, keywords,
                            dm_message, public_reply_enabled, public_reply_message,
                            require_follow, follow_prompt_message,
                            dm_trigger_enabled, ai_enabled)
         VALUES ('F1', 'Flow', TRUE, TRUE, '{link}', 'Hi {username}, here is your link!',
                 FALSE, NULL, FALSE, NULL, FALSE, FALSE)`,
      );
      if (Object.keys(overrides).length > 0) {
        const keys = Object.keys(overrides);
        await query(
          `UPDATE flows SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = 'F1'`,
          keys.map((k) => overrides[k])
        );
      }
    }

    const commentJob = (overrides = {}) => ({
      payload: {
        automationId: "F1",
        accountId: "ACCT1",
        commentId: "C1",
        text: "send me the LINK please",
        commenterId: "USER1",
        commenterName: "ana",
        mediaId: "M1",
        matchedKeyword: "link",
        ...overrides,
      },
    });

    async function log() {
      const { rows } = await query("SELECT * FROM dm_logs WHERE automation_id = 'F1' AND comment_id = $1", ["C1"]);
      return rows[0];
    }

    it("happy path: private reply + public reply + contact + counter", async () => {
      await seed();
      await addFlow({ public_reply_enabled: true, public_reply_message: "Replied publicly!" });
      await processCommentJob(commentJob());

      const row = await log();
      assert.equal(row.status, "sent");
      assert.equal(row.matched_keyword, "link");
      assert.equal(row.ai_used, false);
      assert.ok(row.dm_sent_at);
      assert.ok(row.public_reply_sent_at);
      assert.equal(stats.dmSent, 1);

      const posts = stub.state.requests.filter((r) => r.method === "POST");
      assert.equal(posts.length, 2); // public reply + private reply
      const dm = posts.find((r) => r.body?.recipient?.comment_id === "C1");
      assert.equal(dm.body.message.text, "Hi ana, here is your link!");
      assert.equal(dm.auth, "Bearer stub-token");

      const { rows: contacts } = await query("SELECT * FROM contacts");
      assert.equal(contacts.length, 1);
      assert.equal(contacts[0].username, "ana");
    });

    it("second automation on the same comment skips (one private reply rule)", async () => {
      await seed();
      await addFlow();
      await query(
        `INSERT INTO flows (id, name, match_any_post, keywords, dm_message)
         VALUES ('F2', 'Flow 2', TRUE, '{link}', 'other')`
      );
      await processCommentJob(commentJob()); // F1 sends
      await processCommentJob(commentJob({ automationId: "F2" })); // F2 skips

      const { rows } = await query("SELECT status FROM dm_logs WHERE automation_id = 'F2' AND comment_id = 'C1'");
      assert.equal(rows[0].status, "skipped_dedup");
      const dms = stub.state.requests.filter(
        (r) => r.method === "POST" && r.body?.recipient?.comment_id === "C1"
      );
      assert.equal(dms.length, 1); // only F1's reply went out
    });

    it("follow-gate closed: prompt sent, link withheld until next comment", async () => {
      await seed();
      await addFlow({ require_follow: true, follow_prompt_message: "Follow first, {username}!" });
      stub.state.followStatus = false;
      await processCommentJob(commentJob());

      const dms = stub.state.requests.filter((r) => r.method === "POST");
      assert.equal(dms.length, 1);
      assert.equal(dms[0].body.message.text, "Follow first, ana!");

      stub.state.followStatus = true;
      await processCommentJob(commentJob({ commentId: "C2" }));
      const link = stub.state.requests.find(
        (r) => r.method === "POST" && r.body?.recipient?.comment_id === "C2"
      );
      assert.equal(link.body.message.text, "Hi ana, here is your link!");
    });

    it("follow-gate unverifiable: fails open", async () => {
      await seed();
      await addFlow({ require_follow: true });
      stub.state.followStatus = null;
      await processCommentJob(commentJob());
      const dm = stub.state.requests.find(
        (r) => r.method === "POST" && r.body?.recipient?.comment_id === "C1"
      );
      assert.equal(dm.body.message.text, "Hi ana, here is your link!");
    });

    it("DM trigger: direct message, no private reply", async () => {
      await seed();
      await addFlow({ dm_trigger_enabled: true });
      await processDmJob({
        payload: {
          automationId: "F1", accountId: "ACCT1", senderId: "USER7",
          messageId: "MID9", text: "hi, link?", matchedKeyword: "link",
        },
      });
      const { rows } = await query("SELECT status FROM dm_logs WHERE comment_id = 'dm:MID9'");
      assert.equal(rows[0].status, "sent");
      const dm = stub.state.requests.find((r) => r.method === "POST");
      assert.equal(dm.body.recipient.id, "USER7");
      assert.ok(!dm.body.recipient.comment_id);
    });

    it("disconnected account fails terminally without throwing (no retry poison)", async () => {
      await seed();
      await addFlow();
      await query("UPDATE ig_accounts SET is_active = FALSE WHERE instagram_id = 'ACCT1'");
      // Must not throw: the worker treats return as completion, not retry.
      await processCommentJob(commentJob());
      const { rows } = await query("SELECT status, error_message FROM dm_logs WHERE comment_id = 'C1'");
      assert.equal(rows[0].status, "failed");
      assert.match(rows[0].error_message, /reconnect required/);
    });

    it("rate exhaustion reschedules instead of failing", async () => {
      await seed();
      await addFlow();
      process.env.RATE_LIMIT_MAX = "1";
      await query("DELETE FROM rate_counters");
      await processCommentJob(commentJob()); // consumes the single slot
      await assert.rejects(processCommentJob(commentJob({ commentId: "C2" })), RescheduleError);
      process.env.RATE_LIMIT_MAX = "750";
    });

    it("rate-limit (368) error is retryable; permission (100) is terminal", async () => {
      await seed();
      await addFlow();
      stub.state.failSendsWith = {
        status: 429,
        error: { message: "throttled", code: 368, type: "OAuthException" },
      };
      await assert.rejects(processCommentJob(commentJob()), RateLimitError);

      stub.state.failSendsWith = {
        status: 400,
        error: { message: "no permission", code: 100, type: "OAuthException" },
      };
      await processCommentJob(commentJob({ commentId: "C9" })); // does not throw
      const { rows } = await query("SELECT status FROM dm_logs WHERE comment_id = 'C9'");
      assert.equal(rows[0].status, "failed");
    });
  });
}
