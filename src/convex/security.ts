"use node";

/**
 * Shared security + webhook-parsing helpers for the thin control plane.
 *
 * Architecture adapted from the patterns proven by OpenReply
 * (https://github.com/diwenne/openreply, MIT License,
 * Copyright (c) 2026 Anish Raj, Copyright (c) 2026 Diwen Huang):
 * - signed OAuth state with expiry
 * - raw-body HMAC webhook verification with timing-safe compare
 * - early self/echo filtering before any DB write or job enqueue
 * - Unicode-aware keyword matching
 *
 * This file re-implements those concepts for Chat Flow AI's Convex actions.
 * It is NOT a copy of OpenReply source; logic is written for this codebase
 * and its Postgres-backed customer-backend successor.
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// OAuth state (signed, stateless, 10-minute expiry)
// ---------------------------------------------------------------------------

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function getStateSecret(): string {
  const secret =
    process.env.OAUTH_STATE_SECRET || process.env.META_APP_SECRET;
  if (!secret) {
    throw new Error(
      "OAUTH_STATE_SECRET (or META_APP_SECRET fallback) is not configured"
    );
  }
  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getStateSecret())
    .update(payload)
    .digest("base64url");
}

export interface OAuthState {
  userId: string;
  nonce: string;
  ts: number;
}

/** Create a signed state token binding the OAuth flow to a Convex user. */
export function createOAuthState(userId: string): string {
  const payload = base64UrlEncode(
    JSON.stringify({
      userId,
      nonce: crypto.randomBytes(16).toString("hex"),
      ts: Date.now(),
    } satisfies OAuthState)
  );
  return `${payload}.${signPayload(payload)}`;
}

/** Verify a state token. Returns the bound userId or null when invalid. */
export function verifyOAuthState(state: string | null): OAuthState | null {
  if (!state) return null;
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  try {
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return false as unknown as null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as OAuthState;
    if (!parsed.userId || !parsed.nonce) return null;
    if (Date.now() - parsed.ts > STATE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Webhook signature verification (raw body, timing-safe)
// ---------------------------------------------------------------------------

/**
 * Verify Meta's `x-hub-signature-256` header against the RAW request body.
 * Accepts a match against any configured app secret (Meta signs Instagram
 * webhooks with either the Facebook or Instagram app secret depending on
 * login type). Returns false when headers/secrets are missing — never throws
 * for a mismatched signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  if (!signature || !rawBody) return false;
  const secrets = [
    process.env.META_APP_SECRET,
    process.env.FACEBOOK_APP_SECRET,
    process.env.INSTAGRAM_APP_SECRET,
  ].filter((s): s is string => Boolean(s));
  if (secrets.length === 0) {
    console.error("No Meta app secret configured for webhook verification");
    return false;
  }
  return secrets.some((secret) => {
    const expected =
      "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

/** Strict verify-token check — no hardcoded fallback. */
export function verifyTokenMatches(provided: string | null): boolean {
  const expected = process.env.WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    console.error("WEBHOOK_VERIFY_TOKEN is not configured");
    return false;
  }
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Webhook event parsing with early filtering
// ---------------------------------------------------------------------------

export interface ParsedCommentEvent {
  instagramAccountId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  mediaId: string;
  timestamp?: string;
}

export interface ParsedMessageEvent {
  instagramAccountId: string;
  senderId: string;
  recipientId: string;
  messageId?: string;
  text?: string;
  timestamp?: number;
}

// Minimal structural types for the Meta payload (not exhaustive).
interface MetaPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
        is_deleted?: boolean;
        is_unsupported?: boolean;
      };
    }>;
    changes?: Array<{
      field?: string;
      value?: {
        id?: string;
        comment_id?: string;
        text?: string;
        timestamp?: string;
        from?: { id?: string; username?: string };
        media?: { id?: string };
        media_id?: string;
      };
    }>;
  }>;
}

/**
 * Extract comment events, dropping anything that can never trigger automation:
 * wrong object type, missing ids, or the account's own comments (Meta rejects
 * DMing yourself, so queueing those only burns quota and retries).
 */
export function parseCommentEvents(payload: MetaPayload): ParsedCommentEvent[] {
  const events: ParsedCommentEvent[] = [];
  if (!payload || payload.object !== "instagram") return events;
  for (const entry of payload.entry ?? []) {
    const accountId = entry.id;
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const value = change.value;
      const commentId = value?.id ?? value?.comment_id;
      const mediaId = value?.media?.id ?? value?.media_id;
      const commenterId = value?.from?.id;
      if (!accountId || !commentId || !mediaId || !commenterId) continue;
      if (commenterId === accountId) continue; // self-comment
      events.push({
        instagramAccountId: accountId,
        commentId,
        commentText: value?.text ?? "",
        commenterId,
        commenterName: value?.from?.username,
        mediaId,
        timestamp: value?.timestamp,
      });
    }
  }
  return events;
}

/**
 * Extract inbound-DM events, dropping echoes of our own sends (an autoreply
 * containing its own keyword must never retrigger itself), deleted /
 * unsupported messages, attachment-only messages, and self-sends.
 */
export function parseMessageEvents(payload: MetaPayload): ParsedMessageEvent[] {
  const events: ParsedMessageEvent[] = [];
  if (!payload || payload.object !== "instagram") return events;
  for (const entry of payload.entry ?? []) {
    const accountId = entry.id;
    for (const msg of entry.messaging ?? []) {
      const message = msg.message;
      if (!message) continue;
      if (message.is_echo || message.is_deleted || message.is_unsupported) continue;
      const senderId = msg.sender?.id;
      const recipientId = msg.recipient?.id ?? accountId;
      if (!senderId || !recipientId) continue;
      if (senderId === accountId) continue; // self-send
      const text = message.text?.trim();
      if (!text) continue;
      events.push({
        instagramAccountId: accountId ?? recipientId,
        senderId,
        recipientId,
        messageId: message.mid,
        text,
        timestamp: msg.timestamp,
      });
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Keyword matching (Unicode-aware, diacritic-tolerant for Latin)
// ---------------------------------------------------------------------------

export interface KeywordMatchResult {
  matched: boolean;
  matchedKeyword: string | null;
}

export function stripSpecialCharacters(text: string): string {
  // Emojis, symbols, and punctuation are all non-(letter/number/whitespace),
  // so a single Unicode-aware pass removes them without an emoji-range table.
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fold Latin diacritics only (preco <-> preço). Marks from other scripts are
 * preserved because they are load-bearing (Devanagari, Thai, Arabic, etc.).
 */
export function foldDiacritics(text: string): string {
  let out = "";
  let baseIsLatin = false;
  for (const char of text.normalize("NFD")) {
    if (/\p{M}/u.test(char)) {
      if (!baseIsLatin) out += char;
      continue;
    }
    baseIsLatin = /\p{Script=Latin}/u.test(char);
    out += char;
  }
  return out.normalize("NFC");
}

function normalizeForMatch(text: string): string {
  return foldDiacritics(stripSpecialCharacters(text)).toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * OR-match comment text against keywords. Whole-word mode uses Unicode-aware
 * lookarounds instead of ASCII \b so non-Latin scripts match correctly.
 */
export function matchKeywords(
  commentText: string,
  keywords: string[],
  wholeWordMatch: boolean = true
): KeywordMatchResult {
  if (!commentText || keywords.length === 0) {
    return { matched: false, matchedKeyword: null };
  }
  const cleanedText = normalizeForMatch(commentText);
  if (!cleanedText) return { matched: false, matchedKeyword: null };

  for (const keyword of keywords) {
    const cleanedKeyword = normalizeForMatch(keyword);
    if (!cleanedKeyword) continue;
    if (wholeWordMatch) {
      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}])${escapeRegExp(cleanedKeyword)}(?![\\p{L}\\p{N}])`,
        "iu"
      );
      if (regex.test(cleanedText)) {
        return { matched: true, matchedKeyword: keyword };
      }
    } else if (cleanedText.includes(cleanedKeyword)) {
      return { matched: true, matchedKeyword: keyword };
    }
  }
  return { matched: false, matchedKeyword: null };
}
