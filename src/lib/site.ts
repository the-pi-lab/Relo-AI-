/**
 * Single source of truth for site-wide constants.
 *
 * The production domain is NOT decided yet. Until it is, everything that
 * needs an absolute URL imports SITE_URL from here — change it in one place
 * and the runtime canonical, OG tags, JSON-LD and sitemap all follow.
 *
 * When you pick the domain, also update these three files (they are static and
 * cannot import this module):
 *   • index.html   — <link rel="canonical">, og:url, og:image, JSON-LD @id URLs
 *   • public/robots.txt   — Sitemap: line
 *   • public/sitemap.xml  — every <loc>
 */
export const SITE_URL = "https://relo.ai";

/** Absolute URL helper, e.g. absUrl("/privacy") → "https://relo.ai/privacy" */
export const absUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Brand + contact details reused across the marketing and legal surfaces. */
export const BRAND = {
  name: "RELO",
  operator: "The π Lab",
  email: "hello@thepilab.in",
  site: "thepilab.in",
  linkedin: "https://www.linkedin.com/company/the-%CF%80-lab/",
  /** 1200x630 share card — regenerate with: python scripts/generate-og.py */
  ogImage: absUrl("/og.png"),
  logo: absUrl("/logo.png"),
} as const;

/**
 * The three tiers, in one place so pricing copy, schema.org offers and the
 * in-app paywall can never drift apart. Prices exclude local tax — the
 * merchant of record (Lemon Squeezy) or the UPI flow handles it.
 */
export const TIERS = {
  free: {
    name: "Free",
    inr: 0,
    usd: 0,
    blurb: "Taste the autopilot",
  },
  pro: {
    name: "Pro",
    inr: 149,
    usd: 9.99,
    blurb: "For creators who sell",
  },
  studio: {
    name: "Studio",
    inr: 399,
    usd: 24.99,
    blurb: "For builders & agencies",
  },
} as const;

export type TierKey = keyof typeof TIERS;
