import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCommentEvents, parseMessageEvents } from "../src/parse.js";

const commentPayload = (overrides = {}) => ({
  object: "instagram",
  entry: [
    {
      id: "ACCT1",
      changes: [
        {
          field: "comments",
          value: {
            id: "C1",
            text: "link please",
            from: { id: "USER1", username: "user1" },
            media: { id: "M1" },
            ...overrides,
          },
        },
      ],
    },
  ],
});

describe("parseCommentEvents", () => {
  it("extracts a valid comment", () => {
    const events = parseCommentEvents(commentPayload());
    assert.equal(events.length, 1);
    assert.equal(events[0].commentId, "C1");
    assert.equal(events[0].mediaId, "M1");
  });
  it("drops the account's own comments", () => {
    const events = parseCommentEvents(
      commentPayload({ from: { id: "ACCT1", username: "me" } })
    );
    assert.equal(events.length, 0);
  });
  it("ignores non-instagram objects", () => {
    assert.equal(parseCommentEvents({ object: "page", entry: [] }).length, 0);
  });
  it("drops events with missing ids", () => {
    assert.equal(parseCommentEvents({ object: "instagram", entry: [{}] }).length, 0);
  });
});

const messagePayload = (message) => ({
  object: "instagram",
  entry: [
    {
      id: "ACCT1",
      messaging: [
        {
          sender: { id: "USER1" },
          recipient: { id: "ACCT1" },
          message,
        },
      ],
    },
  ],
});

describe("parseMessageEvents", () => {
  it("extracts a valid DM", () => {
    const events = parseMessageEvents(
      messagePayload({ mid: "M1", text: "hi there" })
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].text, "hi there");
  });
  it("drops echoes of our own sends", () => {
    const events = parseMessageEvents(
      messagePayload({ mid: "M1", text: "link", is_echo: true })
    );
    assert.equal(events.length, 0);
  });
  it("drops deleted/unsupported/textless messages", () => {
    assert.equal(parseMessageEvents(messagePayload({ mid: "M1", is_deleted: true })).length, 0);
    assert.equal(parseMessageEvents(messagePayload({ mid: "M1", is_unsupported: true })).length, 0);
    assert.equal(parseMessageEvents(messagePayload({ mid: "M1" })).length, 0);
  });
});
