/**
 * Runtime configuration.
 *
 * Every value here is public by design: the API base URL, the Meta app id and
 * the OAuth redirect URI. The app secret never reaches the browser — the Worker
 * exchanges the code server-side.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so this module is safe to
 * import from client components.
 */

const trimTrailing = (value: string) => value.replace(/\/+$/, "");

const getEnv = (key: string, viteKey: string, fallback = ""): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]!;
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (_) {}
  return fallback;
};

/** Where the Cloudflare Worker lives. Defaults to the live production worker. */
export const API_URL = trimTrailing(
  process.env.NEXT_PUBLIC_API_URL || "https://relo-engine.empty-smoke-5043.workers.dev"
);

/** The public origin of this app, used for OAuth redirects and share links. */
export const APP_URL = trimTrailing(
  process.env.NEXT_PUBLIC_APP_URL || "https://relo-nu.vercel.app"
);

/** Meta (Facebook) app id. The matching secret lives only on the Worker. */
export const META_APP_ID = (
  process.env.NEXT_PUBLIC_META_APP_ID || "2078625202922249"
).trim();

/**
 * The page Meta sends the creator back to after the OAuth dialog. It must be
 * registered verbatim in the Meta app's "Valid OAuth Redirect URIs".
 */
export const META_REDIRECT_URI = (
  process.env.NEXT_PUBLIC_META_REDIRECT_URI ||
  (typeof window !== "undefined" ? `${window.location.origin}/auth/meta/callback` : "https://relo-nu.vercel.app/auth/meta/callback")
).trim();

/** Cloudflare Turnstile site key. Without it the widget is simply not shown. */
export const TURNSTILE_SITE_KEY = (
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
).trim();

/**
 * Scopes for Facebook Login for Business. RELO reads the Pages the creator
 * manages, the Instagram account linked to each Page, and then replies to
 * comments and DMs through that Page.
 */
export const META_SCOPES = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
].join(",");

export const META_OAUTH_VERSION = "v21.0";

export function metaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    response_type: "code",
    scope: META_SCOPES,
    state,
  });
  return `https://www.facebook.com/${META_OAUTH_VERSION}/dialog/oauth?${params.toString()}`;
}

export const isMetaConfigured = () => Boolean(META_APP_ID && META_REDIRECT_URI);
