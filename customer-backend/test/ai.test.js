// AI layer tests: stubbed providers (no real API calls) + engine fallback.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { pgUrl, ensureDb } from "./helpers.js";
import { query } from "../src/db.js";
import { protectSecret } from "../src/crypto.js";
import { generateReply, aiStatus } from "../src/ai/index.js";
import { processCommentJob } from "../src/engine.js";
import { startMetaStub } from "./meta-stub.js";

function startAiStub() {
  const state = { requests: [], mode: "ok" }; // ok | empty | error
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      state.requests.push({ url: req.url, body: raw ? JSON.parse(raw) : null });
      const send = (code, obj) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(obj));
      };
      if (state.mode === "error") return send(500, { error: "boom" });
      if (state.mode === "empty") {
        return req.url.includes("generateContent")
          ? send(200, { candidates: [] })
          : send(200, { choices: [] });
      }
      return req.url.includes("generateContent")
        ? send(200, { candidates: [{ content: { parts: [{ text: "Gemini says hi!" }] } }] })
        : send(200, { choices: [{ message: { content: "AI says hi!" } }] });
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        state,
        port: server.address().port,
        close() {
          return new Promise((r) => server.close(r));
        },
      });
    });
  });
}

describe("aiStatus / generateReply (no DB)", () => {
  it("reports unconfigured provider", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    assert.deepEqual(aiStatus(), { provider: "none", configured: false, model: null });
  });

  it("throws when unconfigured", async () => {
    delete process.env.AI_PROVIDER;
    await assert.rejects(generateReply({ userText: "hi" }), /not configured/);
  });
});

if (!pgUrl()) {
  it("pg-backed AI engine tests (skipped: TEST_DATABASE_URL not set)", () => {});
} else {
  describe("engine AI paths (stubbed providers + stubbed Meta)", () => {
    let ai;
    let meta;

    before(async () => {
      ai = await startAiStub();
      meta = await startMetaStub();
      process.env.META_GRAPH_PROTOCOL = "http";
      process.env.META_GRAPH_HOST = `127.0.0.1:${meta.port}`;
      process.env.META_GRAPH_API_VERSION = "vtest";
      process.env.OPENAI_BASE_URL = `http://127.0.0.1:${ai.port}`;
      process.env.GEMINI_BASE_URL = `http://127.0.0.1:${ai.port}`;
      await ensureDb();
    });

    after(async () => {
      await ai.close();
      await meta.close();
    });

    async function seedAiFlow() {
      await ensureDb();
      ai.state.requests = [];
      ai.state.mode = "ok";
      meta.reset();
      process.env.AI_PROVIDER = "openai";
      process.env.OPENAI_API_KEY = "test-key";
      await query(
        "INSERT INTO ig_accounts (instagram_id, username, access_token) VALUES ('ACCT1', 'u', $1)",
        [protectSecret("stub-token")]
      );
      await query(
        `INSERT INTO flows (id, name, match_any_post, keywords, dm_message, ai_enabled, ai_prompt)
         VALUES ('FAI', 'AI flow', TRUE, '{link}', 'Template fallback', TRUE, 'Be brief')`
      );
    }

    const job = (commentId) => ({
      payload: {
        automationId: "FAI", accountId: "ACCT1", commentId,
        text: "link please", commenterId: "USER1", commenterName: "ana",
        mediaId: "M1", matchedKeyword: "link",
      },
    });

    it("ai_enabled flow uses the provider reply and marks ai_used", async () => {
      await seedAiFlow();
      await processCommentJob(job("CA1"));
      const { rows } = await query("SELECT status, ai_used FROM dm_logs WHERE comment_id = 'CA1'");
      assert.equal(rows[0].status, "sent");
      assert.equal(rows[0].ai_used, true);
      assert.equal(ai.state.requests.length, 1);
      const dm = meta.state.requests.find((r) => r.method === "POST" && r.body?.recipient?.comment_id === "CA1");
      assert.equal(dm.body.message.text, "AI says hi!");
    });

    it("AI failure falls back to template (never a failed delivery)", async () => {
      await seedAiFlow();
      ai.state.mode = "error";
      await processCommentJob(job("CA2"));
      const { rows } = await query("SELECT status, ai_used FROM dm_logs WHERE comment_id = 'CA2'");
      assert.equal(rows[0].status, "sent");
      assert.equal(rows[0].ai_used, false);
      const dm = meta.state.requests.find((r) => r.method === "POST" && r.body?.recipient?.comment_id === "CA2");
      assert.equal(dm.body.message.text, "Template fallback");
    });

    it("gemini adapter works through the same interface", async () => {
      await seedAiFlow();
      process.env.AI_PROVIDER = "gemini";
      process.env.GEMINI_API_KEY = "test-key";
      const text = await generateReply({ userText: "hello" });
      assert.equal(text, "Gemini says hi!");
      process.env.AI_PROVIDER = "openai";
    });

    it("keyword-only flows never call AI even when configured", async () => {
      await seedAiFlow();
      await query("UPDATE flows SET ai_enabled = FALSE WHERE id = 'FAI'");
      await processCommentJob(job("CA3"));
      const { rows } = await query("SELECT status, ai_used FROM dm_logs WHERE comment_id = 'CA3'");
      assert.equal(rows[0].status, "sent");
      assert.equal(rows[0].ai_used, false);
      assert.equal(ai.state.requests.length, 0);
    });
  });
}
