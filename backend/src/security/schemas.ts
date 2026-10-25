import { z } from "zod";
import { MAX_JSON_BODY_BYTES, cleanText, exceedsBodyLimit } from "./validate";

/**
 * Server-side request schemas.
 *
 * Every write endpoint parses its body through one of these, so a request that
 * bypasses the dashboard entirely (curl, a leaked token, a replayed form) is
 * held to exactly the same rules as the UI.
 *
 * These schemas are deliberately *structural*: they pin the shape (object vs
 * array), the type of every field, and hard upper bounds that mirror the
 * columns the values land in. Business rules that own a specific, user-facing
 * error code ("SPAM_PROTECTION_VIOLATION", "INVALID_LINK", "TITLE_TOO_LONG",
 * …) stay in the route, immediately after the parse, so a rejected request
 * still explains itself the way the dashboard expects. Anything the schema
 * rejects is answered with a generic `INVALID_INPUT` plus the offending field
 * name — never the raw body and never a stack trace.
 */

/* ── primitives ──────────────────────────────────────────────────────── */

/** A string field with a hard ceiling. `.trim()` runs before the max check. */
const text = (max: number) => z.string().trim().max(max);

/** An optional string field; an absent field stays `undefined`. */
const optionalText = (max: number) => text(max).optional();

/** An id-ish field: letters, digits, hyphen, underscore, dot-free. */
const optionalId = z
  .string()
  .trim()
  .max(64)
  .regex(/^[A-Za-z0-9_-]*$/, "must contain only letters, numbers, hyphens and underscores")
  .optional();

const requiredId = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "must contain only letters, numbers, hyphens and underscores");

/** Coerces a JSON boolean from `true`/`false` only — never from "yes"/1. */
const flag = z.boolean().optional();

/**
 * Turnstile token, accepted under the field name the widget uses natively or
 * the friendlier alias. The header form is read separately in captcha.ts.
 */
const captchaFields = {
  captchaToken: optionalText(4096),
  "cf-turnstile-response": optionalText(4096),
};

/* ── auth ────────────────────────────────────────────────────────────── */

export const otpSendSchema = z.object({
  email: text(320).transform((value) => value.toLowerCase()),
  ...captchaFields,
});

export const otpVerifySchema = z.object({
  email: text(320).transform((value) => value.toLowerCase()),
  // Format is enforced by the OTP lookup; a wrong shape is simply not a code.
  code: text(12),
  ...captchaFields,
});

export const metaCallbackSchema = z.object({
  code: optionalText(2048),
  accessToken: optionalText(2048),
  redirectUri: optionalText(500),
});

export const referralClaimSchema = z.object({
  code: text(32),
});

/* ── reels automation ────────────────────────────────────────────────── */

const templateButtonSchema = z.object({
  type: text(20),
  title: text(200),
  url: optionalText(2048),
  payload: optionalText(1000),
});

const templateCardSchema = z.object({
  title: text(200),
  subtitle: optionalText(200),
  imageUrl: optionalText(8192),
  // Free = 2, Pro/Studio = 3; the exact ceiling is applied by the route.
  buttons: z.array(templateButtonSchema).max(5),
  optInText: optionalText(200),
  optInButtonText: optionalText(50),
});

export const automationSaveSchema = z.object({
  id: optionalId,
  accountId: requiredId,
  instagramMediaId: text(128),
  reelPermalink: text(2048),
  reelThumbnailUrl: optionalText(8192),
  triggerKeywords: z.array(text(40)).max(25).default([]),
  commentReplies: z.array(text(600)).max(10).default([]),
  templateCard: templateCardSchema,
  isActive: flag,
  followUpEnabled: flag,
  followUpDelayMinutes: z.number().optional(),
  followGateEnabled: flag,
});

/* ── products ────────────────────────────────────────────────────────── */

export const productSaveSchema = z.object({
  id: optionalId,
  accountId: requiredId,
  name: text(200),
  priceText: optionalText(200),
  description: optionalText(2000),
  link: optionalText(500),
  imageUrl: optionalText(500),
  isActive: flag,
});

/* ── campaigns ───────────────────────────────────────────────────────── */

export const campaignSaveSchema = z.object({
  id: optionalId,
  accountId: requiredId,
  mediaId: text(128),
  kind: optionalText(20),
  text: optionalText(5000),
  card: z.unknown().optional(),
  status: optionalText(20),
  scheduledAt: z.number().optional(),
  usesHumanAgentTag: flag,
});

/* ── canvas flows ────────────────────────────────────────────────────── */

export const flowSaveSchema = z.object({
  id: optionalId,
  accountId: requiredId,
  name: optionalText(200),
  graph: z.unknown().optional(),
  isActive: flag,
  isPublished: flag,
});

/* ── content planner ─────────────────────────────────────────────────── */

export const contentPlanSaveSchema = z.object({
  id: optionalId,
  title: optionalText(500),
  hook: optionalText(1000),
  caption: optionalText(5000),
  // Unknown statuses are coerced to "idea" by the route, not rejected.
  status: optionalText(32),
  plannedFor: z.number().optional(),
  automationId: optionalId,
});

export const contentPlanPublishSchema = z.object({
  id: optionalText(64),
  mediaId: optionalText(128),
});

/* ── link in bio ─────────────────────────────────────────────────────── */

const linkBlockSchema = z.object({
  id: optionalText(64),
  productId: optionalText(64),
  targetUrl: optionalText(500),
  label: optionalText(200),
});

export const linkPageSaveSchema = z.object({
  slug: optionalText(60),
  headline: optionalText(200),
  bio: optionalText(1000),
  theme: optionalText(20),
  isPublished: flag,
  // The public cap is 20; the route owns the user-facing TOO_MANY_BLOCKS code.
  blocks: z.array(linkBlockSchema).max(50).default([]),
});

/* ── billing & contact ───────────────────────────────────────────────── */

export const manualUpiSchema = z.object({
  plan: optionalText(20),
  utr: text(64),
});

export const agencyContactSchema = z.object({
  email: optionalText(320),
  accountCount: z.number().optional(),
  plan: optionalText(20),
  notes: optionalText(2000),
  ...captchaFields,
});

export const adminPaymentSchema = z.object({
  paymentId: optionalText(64),
  approve: flag,
});

/* ── parsing ─────────────────────────────────────────────────────────── */

export type ParseFailure = {
  ok: false;
  status: 400 | 413;
  code: string;
  message: string;
};

export type ParseSuccess<T> = { ok: true; data: T };

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

/**
 * Reads, size-limits, parses and schema-validates a JSON body. The failure
 * message is derived from the schema issue path only — never from a stack
 * trace or the raw body.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<ParseResult<z.infer<T>>> {
  const tooLarge: ParseFailure = {
    ok: false,
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: `Request body must be smaller than ${Math.floor(MAX_JSON_BODY_BYTES / 1024)}KB.`,
  };

  if (exceedsBodyLimit(request)) return tooLarge;

  let raw: unknown;
  try {
    const bodyText = await request.text();
    if (bodyText.length > MAX_JSON_BODY_BYTES) return tooLarge;
    raw = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      message: "Malformed request payload.",
    };
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_INPUT",
      message: "The request payload must be a JSON object.",
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_INPUT",
      message: describeIssues(parsed.error),
    };
  }

  return { ok: true, data: parsed.data };
}

function describeIssues(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "The request payload is invalid.";
  const field = first.path.filter((part) => typeof part === "string").join(".");
  // Trim the value out of zod's message where it echoes the input back.
  const detail = cleanText(first.message, 160, true);
  return field ? `${field}: ${detail}` : detail;
}
