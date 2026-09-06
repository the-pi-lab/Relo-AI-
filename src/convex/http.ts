import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Escape a value for safe embedding inside a single-quoted JS string.
function jsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/</g, "\\x3c");
}

// OAuth callback handlers.
// The Meta redirect cannot carry Convex auth headers, so identity comes from
// the signed `state` token created in oauth.getAuthUrl — never from cookies.
http.route({
  path: "/api/oauth/callback/instagram",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const origin = process.env.SITE_URL ?? "";

    const postMessage = (payload: string) =>
      `<html><body><script>window.opener.postMessage(${payload}, '${jsString(origin)}'); window.close();</script></body></html>`;

    if (error || !code) {
      return new Response(
        postMessage(
          `{type: 'oauth-error', platform: 'instagram', error: '${jsString(error || "No code received")}'}`
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    if (!state) {
      return new Response(
        postMessage(
          `{type: 'oauth-error', platform: 'instagram', error: 'Missing OAuth state'}`
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    try {
      // Identity verification happens inside handleInstagramCallback (a Node
      // action with access to crypto). This route only forwards code + state.
      await ctx.runAction(internal.oauth.handleInstagramCallback, {
        code,
        state,
      });

      return new Response(
        postMessage(`{type: 'oauth-success', platform: 'instagram'}`),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } catch (error) {
      console.error("Instagram OAuth error:", error);
      return new Response(
        postMessage(
          `{type: 'oauth-error', platform: 'instagram', error: '${jsString(String(error))}'}`
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }
  }),
});

// WhatsApp OAuth removed in v2 (Instagram-only).
http.route({
  path: "/api/oauth/callback/whatsapp",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("WhatsApp support has been removed", { status: 410 });
  }),
});

// Instagram Webhook
http.route({
  path: "/api/webhooks/instagram",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Strict check: WEBHOOK_VERIFY_TOKEN must be configured, and the provided
    // token must match exactly. No hardcoded fallback (that was a credential
    // bypass — anyone knowing the default could subscribe a webhook).
    const expected = process.env.WEBHOOK_VERIFY_TOKEN;
    if (
      expected &&
      token &&
      token.length === expected.length &&
      mode === "subscribe" &&
      token === expected
    ) {
      return new Response(challenge ?? "", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }),
});

http.route({
  path: "/api/webhooks/instagram",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Read the RAW body: HMAC verification must run over the exact bytes Meta
    // signed. Parsing to JSON first and re-stringifying breaks the signature.
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || undefined;

    let payload: unknown = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Always acknowledge quickly; verification + filtering happen in the
    // action. Invalid signatures are logged there and dropped silently so
    // Meta's retry logic is not fed by attacker-controlled traffic.
    await ctx.runAction(internal.webhooks.handleInstagramWebhook, {
      payload,
      signature,
      rawBody,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// WhatsApp webhooks removed in v2 (Instagram-only).
http.route({
  path: "/api/webhooks/whatsapp",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("WhatsApp support has been removed", { status: 410 });
  }),
});

http.route({
  path: "/api/webhooks/whatsapp",
  method: "POST",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ success: false, error: "WhatsApp support has been removed" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;