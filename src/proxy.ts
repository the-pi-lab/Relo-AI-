import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge proxy (the Next 16 replacement for `middleware.ts`).
 *
 * Responsibilities, in order:
 *   1. Mint a per-request CSP nonce and attach a strict Content-Security-Policy.
 *   2. Send the nonce upstream as `x-nonce` so the root layout can stamp it on
 *      the inline theme script — that is the only inline script we allow.
 *   3. Add the transport/hardening headers that must exist on every document
 *      response, including HSTS, so a host that ignores `vercel.json` is still
 *      covered.
 *
 * A nonce must be unique per response, which means the page has to render
 * dynamically. The root layout already reads `headers()`, so that is satisfied.
 */

const isDev = process.env.NODE_ENV === "development";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonce'd Next bootstrap load its own chunks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Tailwind/Radix write inline style attributes; a nonce cannot cover those.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src 'self' https: wss:${isDev ? " ws: http://localhost:*" : ""}`,
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the nonce from the CSP header on the *request* to stamp its own
  // script tags; the response header below is what the browser enforces.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except API routes, Next internals, and static files. Those do
     * not render a document and gain nothing from a per-request nonce.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|txt|xml)$).*)",
  ],
};
