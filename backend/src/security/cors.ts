import type { Env } from "../db";

/**
 * CORS policy — allowlist only, never a wildcard.
 *
 * The dashboard authenticates with a Bearer token rather than a cookie, so
 * `Access-Control-Allow-Credentials` is deliberately never sent. That means a
 * misconfigured `*` would still let any origin read a leaked token, which is
 * exactly why the origin is echoed only when it is on the list.
 *
 * Configuration: `ALLOWED_ORIGINS` (comma-separated) on the Worker, plus the
 * `PUBLIC_APP_URL` origin, which is where the dashboard actually runs.
 * Localhost origins are added only outside production.
 */

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS =
  "Content-Type, Authorization, X-Admin-Secret, X-Turnstile-Token, X-Requested-With";
const EXPOSED_HEADERS = "Content-Disposition, Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining";
const MAX_AGE_SECONDS = "600";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

/** The exact set of origins allowed to call this API. */
export function allowedOrigins(env: Partial<Env>): string[] {
  const origins: string[] = [];

  for (const entry of (env.ALLOWED_ORIGINS || "").split(",")) {
    const normalized = normalizeOrigin(entry);
    if (normalized) origins.push(normalized);
  }

  const appUrl = env.PUBLIC_APP_URL ? normalizeOrigin(env.PUBLIC_APP_URL) : "";
  if (appUrl) origins.push(appUrl);

  if ((env.ENVIRONMENT || "production") !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8787",
      "http://127.0.0.1:8787"
    );
  }

  return Array.from(new Set(origins));
}

/**
 * CORS response headers for a request, or `{}` when the caller's origin is not
 * on the allowlist. Returning `{}` (rather than a wildcard) makes the browser
 * refuse the response, which is the correct failure mode.
 */
export function corsHeadersFor(request: Request, env: Partial<Env>): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!origin) return {};

  if (!allowedOrigins(env).includes(normalizeOrigin(origin))) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": MAX_AGE_SECONDS,
    Vary: "Origin",
  };
}

/**
 * Preflight response. Always 204 so a disallowed origin learns nothing from the
 * status code; the missing Allow-Origin header is what blocks it.
 */
export function preflightResponse(request: Request, env: Partial<Env>): Response {
  const headers = corsHeadersFor(request, env);
  return new Response(null, {
    status: 204,
    headers: { ...headers, Vary: "Origin, Access-Control-Request-Headers" },
  });
}

/** Applies the allowlisted CORS headers to an already-built response. */
export function withCors(response: Response, request: Request, env: Partial<Env>): Response {
  const headers = corsHeadersFor(request, env);
  if (Object.keys(headers).length === 0) return response;

  const decorated = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    decorated.headers.set(key, value);
  }
  return decorated;
}

/** True when a browser request comes from an origin we did not approve. */
export function isDisallowedCrossOrigin(request: Request, env: Partial<Env>): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return !allowedOrigins(env).includes(normalizeOrigin(origin));
}
