import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  timingSafeEqualStr,
  verifyWebhookSignature,
  protectSecret,
  revealSecret,
} from "../src/crypto.js";

describe("timingSafeEqualStr", () => {
  it("compares exactly", () => {
    assert.equal(timingSafeEqualStr("abc", "abc"), true);
    assert.equal(timingSafeEqualStr("abc", "abd"), false);
    assert.equal(timingSafeEqualStr("abc", "abcd"), false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a valid HMAC and rejects tampering", () => {
    const secret = "s3cret";
    const body = '{"object":"instagram"}';
    const sig =
      "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
    assert.equal(verifyWebhookSignature(body, sig, [secret]), true);
    assert.equal(verifyWebhookSignature(body + "x", sig, [secret]), false);
    assert.equal(verifyWebhookSignature(body, null, [secret]), false);
    assert.equal(verifyWebhookSignature(body, sig, []), false);
  });
});

describe("protectSecret/revealSecret", () => {
  it("round-trips plaintext without a key", () => {
    delete process.env.ENCRYPTION_KEY;
    const stored = protectSecret("tok123");
    assert.match(stored, /^plain:/);
    assert.equal(revealSecret(stored), "tok123");
  });
  it("round-trips AES-256-GCM with a key", () => {
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
    const stored = protectSecret("tok123");
    assert.match(stored, /^enc:/);
    assert.equal(revealSecret(stored), "tok123");
    delete process.env.ENCRYPTION_KEY;
  });
});
