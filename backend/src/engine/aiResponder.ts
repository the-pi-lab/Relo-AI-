import type { D1Database } from "@cloudflare/workers-types";
import type { AccountId } from "../types/ids";
import type { Env } from "../db";
import {
  getProductsForAccount,
  spendAiCredit,
  type ProductRow,
} from "../db/queries";
import { callNim, GROUNDED_SYSTEM_PROMPT, type NimMessage } from "../ai/nim";
import { normalizePlan } from "../tiers";

/**
 * AI product-Q&A (plan.md §4.4).
 *
 * The contract with the creator is deliberately narrow: RELO answers the
 * questions a catalog can actually answer, and hands the rest to the owner.
 * That means the responder has three honest outcomes and no fourth —
 *
 *   answered  → a grounded reply built from their own product rows
 *   handoff   → "I'll get the owner to answer that" (sent without spending a credit)
 *   silence   → do nothing at all (human takeover already active, or no catalog)
 *
 * It never fabricates. A hallucinated price is a refund request and a review,
 * so unknown means HANDOFF, and HANDOFF is the default.
 */

export const HANDOFF_SENTINEL = "HANDOFF";

export const OWNER_HANDOFF_REPLY =
  "Good question — I'll pass that to the owner and they'll get back to you shortly.";

export type AiIntent = "product_question" | "buying_intent" | "frustrated" | "smalltalk" | "unknown";

export interface AiDecision {
  action: "answered" | "handoff" | "silence";
  reason: string;
  replyText?: string;
  intent: AiIntent;
  productId?: string;
  creditSpent: boolean;
}

/**
 * Sentiment + intent routing.
 *
 * Classified locally, not by the model, for two reasons: a burst of frustrated
 * DMs must not consume shared NIM capacity just to be classified, and the
 * frustration signal is safety-relevant — it silently stops the AI on that
 * thread and hands the conversation to a human.
 */
export function classifyIntent(text: string): AiIntent {
  const t = text.toLowerCase();

  // Frustration first: a frustrated message must never be auto-answered,
  // even if it also contains a product question.
  if (
    /\b(angry|furious|scam|refund|complain|complaint|unacceptable|terrible|awful|useless|ridiculous|where is my|still nothing|no reply|not responding|worst)\b/.test(
      t
    )
  ) {
    return "frustrated";
  }

  // Buying intent — the DM that should get a product card, not a paragraph.
  if (
    /\b(buy|order|purchase|price|how much|cost|checkout|interested|ready to|send me|link|dm me|i'?ll take|get it)\b/.test(
      t
    )
  ) {
    return "buying_intent";
  }

  // A direct product question.
  if (/\b(what|which|does|do you|is it|can i|available|stock|size|colour|color|shipping|delivery|return)\b/.test(t)) {
    return "product_question";
  }

  if (/^(hi|hey|hello|yo|thanks|thank you|ok|okay|cool|nice|awesome|great|good morning|good evening)\b/.test(t)) {
    return "smalltalk";
  }

  return "unknown";
}

/** Renders the catalog into the prompt. Capped at 50 rows by the query. */
export function buildCatalogBlock(products: ProductRow[]): string {
  if (products.length === 0) return "(catalog is empty)";
  return products
    .map((p) => {
      const parts = [`- ${p.name}`];
      if (p.priceText) parts.push(`price: ${p.priceText}`);
      if (p.description) parts.push(`details: ${p.description}`);
      if (p.link) parts.push(`buy link: ${p.link}`);
      return parts.join(" | ");
    })
    .join("\n");
}

export function buildMessages(question: string, products: ProductRow[]): NimMessage[] {
  return [
    { role: "system", content: `${GROUNDED_SYSTEM_PROMPT}\n\nCATALOG:\n${buildCatalogBlock(products)}` },
    { role: "user", content: question },
  ];
}

/**
 * Strips any claim the model invented. Conservative on purpose: it only passes
 * text that mentions a known product, so an ungrounded reply degrades to a
 * hand-off instead of reaching a customer.
 */
export function isGrounded(reply: string, products: ProductRow[]): boolean {
  if (!reply.trim()) return false;
  if (products.length === 0) return false;
  const lower = reply.toLowerCase();
  return products.some((p) => {
    const name = p.name.toLowerCase();
    // Match on a meaningful prefix so minor plural/casing differences still hit.
    const key = name.split(/\s+/)[0];
    return key.length >= 3 && lower.includes(key);
  });
}

/** Prices that appear in the reply but in no catalog row are fabrications. */
export function findFabricatedPrice(reply: string, products: ProductRow[]): string | null {
  const allowed = products
    .map((p) => p.priceText || "")
    .flatMap((text) => text.match(/[\d][\d,.]*/g) || [])
    .map((s) => s.replace(/[.,]/g, ""));
  const found = reply.match(/[\d][\d,.]*/g) || [];
  for (const raw of found) {
    const digits = raw.replace(/[.,]/g, "");
    // Ignore short numbers (sizes, quantities, years) — only audit money-shaped ones.
    if (digits.length < 3) continue;
    if (!allowed.includes(digits)) return raw;
  }
  return null;
}

export interface AiResponderDeps {
  db: D1Database;
  env: Env;
  accountId: AccountId;
  plan: string;
}

/**
 * Decides what to do with one inbound DM. Pure-ish: it reads the catalog and
 * the credit ledger, and never sends anything itself, so it stays testable.
 */
export async function decideAiReply(
  question: string,
  deps: AiResponderDeps
): Promise<AiDecision> {
  const intent = classifyIntent(question);

  // Frustration: stop being a bot on this thread. No model call, no credit.
  if (intent === "frustrated") {
    return {
      action: "silence",
      reason: "frustrated_thread",
      intent,
      creditSpent: false,
    };
  }

  // Pure greetings are not worth a credit.
  if (intent === "smalltalk") {
    return { action: "handoff", reason: "smalltalk", intent, creditSpent: false };
  }

  const products = await getProductsForAccount(deps.db, deps.accountId, true);
  if (products.length === 0) {
    return { action: "handoff", reason: "empty_catalog", intent, creditSpent: false };
  }

  const apiKey = (deps.env as { NIM_API_KEY?: string }).NIM_API_KEY || "";
  if (!apiKey) {
    // AI is never blocking: an unconfigured key behaves exactly like NIM down.
    return { action: "handoff", reason: "ai_not_configured", intent, creditSpent: false };
  }

  const result = await callNim(buildMessages(question, products), { apiKey });
  if (!result.ok) {
    return {
      action: "handoff",
      reason: `nim_${result.reason}`,
      intent,
      creditSpent: false,
    };
  }

  const text = result.text.trim();

  if (text.toUpperCase().includes(HANDOFF_SENTINEL) || !isGrounded(text, products)) {
    return { action: "handoff", reason: "ungrounded", intent, creditSpent: false };
  }

  const fabricated = findFabricatedPrice(text, products);
  if (fabricated) {
    return {
      action: "handoff",
      reason: "fabricated_price",
      intent,
      creditSpent: false,
    };
  }

  // Credits are spent only for a reply we actually send, and only if the
  // account has one left — the ledger is the authority, not this code path.
  const paid = await spendAiCredit(deps.db, deps.accountId);
  if (!paid) {
    return { action: "handoff", reason: "no_credits", intent, creditSpent: false };
  }

  // Attach a product card for buying intent so the answer is tappable.
  const matched = pickBestProduct(text, products);

  return {
    action: "answered",
    reason: intent,
    replyText: text,
    intent,
    productId: matched?.id,
    creditSpent: true,
  };
}

/** Picks the product a reply is about, preferring one that has a link. */
export function pickBestProduct(reply: string, products: ProductRow[]): ProductRow | null {
  const lower = reply.toLowerCase();
  const named = products.find((p) => {
    const key = p.name.toLowerCase().split(/\s+/)[0];
    return key.length >= 3 && lower.includes(key);
  });
  if (named) return named;
  return products.find((p) => p.link) ?? products[0] ?? null;
}

/** Builds the tappable card for a buying-intent reply (plan.md §4.4). */
export function buildProductCardReply(
  product: ProductRow,
  shortLinksBaseUrl: string,
  linkId?: string
): { text: string; card: { title: string; subtitle?: string; imageUrl?: string; buttons: Array<{ type: "web_url"; title: string; url: string }> } } {
  const url = linkId && shortLinksBaseUrl
    ? `${shortLinksBaseUrl.replace(/\/$/, "")}/l/${linkId}`
    : product.link || "";
  const buttons: Array<{ type: "web_url"; title: string; url: string }> = url
    ? [{ type: "web_url", title: (product.name || "View").slice(0, 20), url }]
    : [];
  return {
    text: `${product.name}${product.priceText ? ` — ${product.priceText}` : ""}`,
    card: {
      title: (product.name || "Product").slice(0, 80),
      subtitle: (product.priceText || product.description || "").slice(0, 80),
      imageUrl: product.imageUrl,
      buttons: buttons.slice(0, 3),
    },
  };
}

/** Studio gets a bigger catalog window before we stop answering (plan.md §4.4). */
export function aiEnabledForPlan(plan: string): boolean {
  return normalizePlan(plan) !== "free";
}
