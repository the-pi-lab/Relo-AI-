import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchKeywords, personalize } from "../src/keyword.js";

describe("matchKeywords", () => {
  it("matches case-insensitively", () => {
    assert.equal(matchKeywords("Send me the LINK please", ["link"]).matched, true);
  });
  it("whole-word mode rejects partials", () => {
    assert.equal(matchKeywords("linking is fun", ["link"]).matched, false);
    assert.equal(matchKeywords("linking is fun", ["link"], false).matched, true);
  });
  it("returns the first matched keyword", () => {
    const r = matchKeywords("price please", ["link", "price"]);
    assert.equal(r.matched, true);
    assert.equal(r.matchedKeyword, "price");
  });
  it("strips emojis before matching", () => {
    assert.equal(matchKeywords("🔗 LINK 🔥", ["link"]).matched, true);
  });
  it("folds Latin diacritics both ways", () => {
    assert.equal(matchKeywords("qual o PREÇO?", ["preco"]).matched, true);
    assert.equal(matchKeywords("qual o preco?", ["preço"]).matched, true);
  });
  it("matches non-Latin scripts whole-word", () => {
    assert.equal(matchKeywords("цена пожалуйста", ["цена"]).matched, true);
    assert.equal(matchKeywords("оценка", ["цена"]).matched, false);
  });
  it("empty text or keywords never match", () => {
    assert.equal(matchKeywords("", ["link"]).matched, false);
    assert.equal(matchKeywords("link", []).matched, false);
  });
});

describe("personalize", () => {
  it("replaces {username} case-insensitively", () => {
    assert.equal(personalize("Hi {USERNAME}!", "ana"), "Hi ana!");
  });
  it("falls back to there", () => {
    assert.equal(personalize("Hi {username}!", null), "Hi there!");
  });
});
