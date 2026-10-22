import { NextResponse } from "next/server";

/**
 * Liveness probe for the web app.
 *
 * Intentionally public *and* intentionally data-free: it returns nothing an
 * unauthenticated caller could act on. Any route that reads or writes tenant
 * data must authenticate. In this codebase that surface lives in the Cloudflare
 * Worker (`backend/src/api/router.ts`), where every non-auth route passes the
 * JWT guard before a handler runs.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "relo-web" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
