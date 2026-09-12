import assert from "node:assert";
import {
  verifyMetaSignature,
  encryptSecret,
  decryptSecret,
} from "../src/crypto";
import {
  parseWebhookEnvelope,
} from "../src/engine/parse";
import {
  normalizeText,
  buildKeywordRegex,
  matchesKeyword,
  findMatchingKeyword,
} from "../src/engine/keyword";
import {
  parseSpintax,
  spin,
  calculateVariations,
  validateReplyVariations,
} from "../src/engine/spintax";
import {
  parseMetaError,
  isRetryable,
  TokenExpiredError,
  RateLimitError,
  ResourceNotFoundError,
  UserNotReachableError,
} from "../src/meta/errors";

async function runTests() {
  console.log("=== RUNNING PHASE 3 TEST SUITE ===");

  // 1. CRYPTO TESTS
  console.log("\n[1] Testing Crypto Utilities...");
  const appSecret = "meta_app_secret_super_secure_key_12345";
  const rawBody = JSON.stringify({ object: "instagram", entry: [] });

  // Compute signature using Web Crypto HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hexSig = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const validHeader = `sha256=${hexSig}`;
  const isSigValid = await verifyMetaSignature(rawBody, validHeader, appSecret);
  assert.strictEqual(isSigValid, true, "Valid Meta signature must verify successfully");

  const isInvalidSig = await verifyMetaSignature(rawBody, "sha256=invalidhex0000", appSecret);
  assert.strictEqual(isInvalidSig, false, "Invalid Meta signature must fail");

  const isTampered = await verifyMetaSignature(rawBody + "tamper", validHeader, appSecret);
  assert.strictEqual(isTampered, false, "Tampered body must fail");

  // AES-256-GCM Encryption / Decryption Round-trip
  const masterKey = "production_master_encryption_key_32bytes!";
  const secretToken = "IGQVJWWkFVRk9vWnpxZAk9WbE5oWXRhQUNNNkJ";
  const encrypted = await encryptSecret(secretToken, masterKey);
  assert.notStrictEqual(encrypted, secretToken, "Ciphertext must not match plaintext");
  const decrypted = await decryptSecret(encrypted, masterKey);
  assert.strictEqual(decrypted, secretToken, "Decrypted token must exactly match original");
  console.log("✓ Crypto utilities passed (HMAC + AES-256-GCM).");

  // 2. PARSE TESTS (OpenReply early filtering)
  console.log("\n[2] Testing Webhook Parsing & Early Filtering...");
  const mockWebhookPayload = {
    object: "instagram",
    entry: [
      {
        id: "ig_page_111",
        time: 1700000000,
        changes: [
          // 1. Valid comment
          {
            field: "comments",
            value: {
              id: "comment_valid_1",
              text: "Hey! Send me the GUIDE please",
              from: { id: "user_customer_999", username: "alex_creator" },
              media: { id: "media_reel_555" },
              created_time: 1700000001,
            },
          },
          // 2. Self-comment (should be dropped)
          {
            field: "comments",
            value: {
              id: "comment_self_2",
              text: "Check your DMs!",
              from: { id: "ig_page_111", username: "my_business_page" },
              media: { id: "media_reel_555" },
            },
          },
          // 3. Incomplete comment (no text, should be dropped)
          {
            field: "comments",
            value: {
              id: "comment_no_text_3",
              text: "",
              from: { id: "user_customer_999", username: "alex" },
            },
          },
        ],
        messaging: [
          // 4. Valid DM
          {
            sender: { id: "user_customer_999" },
            recipient: { id: "ig_page_111" },
            timestamp: 1700000002,
            message: {
              mid: "mid_msg_100",
              text: "Tell me more about pricing",
            },
          },
          // 5. Echo message (sent by bot, should be dropped)
          {
            sender: { id: "user_customer_999" },
            recipient: { id: "ig_page_111" },
            timestamp: 1700000003,
            message: {
              mid: "mid_echo_101",
              text: "Here is your link: ...",
              is_echo: true,
            },
          },
          // 6. Deleted message (should be dropped)
          {
            sender: { id: "user_customer_999" },
            recipient: { id: "ig_page_111" },
            timestamp: 1700000004,
            message: {
              mid: "mid_del_102",
              is_deleted: true,
            },
          },
        ],
      },
    ],
  };

  const parsedEvents = parseWebhookEnvelope(mockWebhookPayload);
  assert.strictEqual(parsedEvents.length, 2, "Only 2 valid events should pass filters");

  const [cEvent, mEvent] = parsedEvents;
  assert.strictEqual(cEvent.type, "comment");
  if (cEvent.type === "comment") {
    assert.strictEqual(cEvent.commentId, "comment_valid_1");
    assert.strictEqual(cEvent.commenterId, "user_customer_999");
    assert.strictEqual(cEvent.text, "Hey! Send me the GUIDE please");
    assert.strictEqual(cEvent.mediaId, "media_reel_555");
  }

  assert.strictEqual(mEvent.type, "message");
  if (mEvent.type === "message") {
    assert.strictEqual(mEvent.mid, "mid_msg_100");
    assert.strictEqual(mEvent.text, "Tell me more about pricing");
  }
  console.log("✓ Webhook parser passed (self-comments & echoes correctly filtered).");

  // 3. KEYWORD ENGINE TESTS (Unicode boundaries & diacritic folding)
  console.log("\n[3] Testing Keyword Engine...");
  // Diacritic folding
  assert.strictEqual(normalizeText("  GÜÍDÈ  "), "guide");
  assert.strictEqual(normalizeText("Café Crème"), "cafe creme");

  // Whole word matches
  assert.strictEqual(matchesKeyword("Send me the GUIDE please!", "GUIDE"), true);
  assert.strictEqual(matchesKeyword("Here is a GUIDELINE for you", "GUIDE"), false);
  assert.strictEqual(matchesKeyword("I was misguided by that", "GUIDE"), false);
  assert.strictEqual(matchesKeyword("🔥GUIDE🔥", "guide"), true);
  assert.strictEqual(matchesKeyword("guide.", "guide"), true);
  assert.strictEqual(matchesKeyword("gùide!", "guide"), true);

  // Multi-word phrase
  assert.strictEqual(matchesKeyword("Can you SEND   THE LINK to me?", "SEND THE LINK"), true);
  assert.strictEqual(matchesKeyword("Do not send the linked file", "SEND THE LINK"), false);

  // findMatchingKeyword
  const matched = findMatchingKeyword("Yes please send VIP access", ["GUIDE", "VIP", "ACCESS"]);
  assert.strictEqual(matched, "VIP");

  // Catch-all
  const catchAllMatch = findMatchingKeyword("Anything goes here", ["*"]);
  assert.strictEqual(catchAllMatch, "*");

  console.log("✓ Keyword engine passed (Unicode whole-word + Latin diacritics).");

  // 4. SPINTAX ENGINE TESTS
  console.log("\n[4] Testing Spintax Engine...");
  const simpleSpintax = "{Hey|Hello|Hi} there!";
  const parsedSimple = parseSpintax(simpleSpintax);
  assert.strictEqual(calculateVariations(parsedSimple), 3);

  const spun1 = spin(simpleSpintax);
  assert.match(spun1, /^(Hey|Hello|Hi) there!$/);

  // Nested spintax
  const nestedSpintax = "{Hey|Hello {there|friend}|Hi}, check your {DMs|inbox}!";
  const parsedNested = parseSpintax(nestedSpintax);
  assert.strictEqual(calculateVariations(parsedNested), 8);

  const spunNested = spin(nestedSpintax);
  assert.ok(spunNested.includes("check your"));

  // Anti-spam validation
  const validReplies = [
    "Sent to your DMs! Check now {🔥|🙌}",
    "{Hey|Hello}, just dispatched your link!",
    "Check your {inbox|messages} right now!",
  ];
  const validationResult = validateReplyVariations(validReplies, 3);
  assert.strictEqual(validationResult.isValid, true);
  assert.ok(validationResult.totalVariations >= 3);

  const invalidReplies = ["Just one reply."];
  const invalidResult = validateReplyVariations(invalidReplies, 3);
  assert.strictEqual(invalidResult.isValid, false);
  console.log("✓ Spintax engine passed (nested AST, variation calculations, anti-spam validation).");

  // 5. META ERROR CLASSIFICATION TESTS
  console.log("\n[5] Testing Meta Error Classification...");
  const tokenErr = parseMetaError(400, {
    error: {
      message: "Session has expired",
      code: 190,
      error_subcode: 463,
    },
  });
  assert.ok(tokenErr instanceof TokenExpiredError);
  assert.strictEqual(isRetryable(tokenErr), false, "Token expired must not be retryable");

  const actionBlockedErr = parseMetaError(400, {
    error: {
      message: "It looks like you were misusing this feature by going too fast.",
      code: 368,
    },
  });
  assert.ok(actionBlockedErr instanceof RateLimitError);
  assert.strictEqual(actionBlockedErr.isActionBlocked, true);
  assert.strictEqual(isRetryable(actionBlockedErr), false, "Action block must not be retryable");

  const rateLimitErr = parseMetaError(400, {
    error: {
      message: "User request limit reached",
      code: 17,
    },
  });
  assert.ok(rateLimitErr instanceof RateLimitError);
  assert.strictEqual(isRetryable(rateLimitErr), true, "Rate limit code 17 is retryable");

  const deletedCommentErr = parseMetaError(404, {
    error: {
      message: "Unsupported get request. Object with ID does not exist.",
      code: 100,
      error_subcode: 33,
    },
  });
  assert.ok(deletedCommentErr instanceof ResourceNotFoundError);
  assert.strictEqual(isRetryable(deletedCommentErr), false, "Deleted comment must not be retryable");

  const unreachableErr = parseMetaError(400, {
    error: {
      message: "Cannot send message to this user due to privacy settings.",
      code: 100,
      error_subcode: 2018001,
    },
  });
  assert.ok(unreachableErr instanceof UserNotReachableError);
  assert.strictEqual(isRetryable(unreachableErr), false, "Unreachable user must not be retryable");

  console.log("✓ Meta error classification passed (all 5 error classes & retry heuristics verified).");
  console.log("\n🎉 ALL PHASE 3 TESTS PASSED SUCCESSFULLY! 100% VERIFIED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
