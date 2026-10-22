import type { Env } from "../db";
import { clientIp } from "./limits";

/**
 * Cloudflare Turnstile verification for public, unauthenticated forms.
 *
 * Applied to: login/signup (OTP send + verify) and the agency contact form.
 *
 * Configuration is a manual step: create a Turnstile widget in the Cloudflare
 * dashboard and set `TURNSTILE_SECRET_KEY` as a Worker secret. The frontend
 * must render the widget and send the token as `cf-turnstile-response` in the
 * body (or `X-Turnstile-Token` header).
 *
 * When the secret is NOT configured the check is skipped and logged loudly,
 * so an unconfigured deployment keeps working instead of locking every user
 * out. `REQUIRE_CAPTCHA=1` turns a missing secret into a hard failure.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface CaptchaResult {
  ok: boolean;
  code?: string;
  message?: string;
}

function tokenFrom(request: Request, bodyToken?: unknown): string {
  if (typeof bodyToken === "string" && bodyToken.trim()) return bodyToken.trim();
  const header = request.headers.get("cf-turnstile-response") || request.headers.get("x-turnstile-token");
  return (header || "").trim();
}

export async function verifyCaptcha(
  request: Request,
  env: Env,
  bodyToken?: unknown
): Promise<CaptchaResult> {
  const secret = env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (env.REQUIRE_CAPTCHA === "1") {
      return {
        ok: false,
        code: "CAPTCHA_UNAVAILABLE",
        message: "This form is temporarily unavailable. Please try again later.",
      };
    }
    console.warn(
      "[Captcha] TURNSTILE_SECRET_KEY is not configured — public forms are running without CAPTCHA."
    );
    return { ok: true };
  }

  const token = tokenFrom(request, bodyToken);
  if (!token) {
    return {
      ok: false,
      code: "CAPTCHA_REQUIRED",
      message: "Please complete the human verification check.",
    };
  }

  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    const ip = clientIp(request);
    if (ip && ip !== "unknown") form.append("remoteip", ip);

    const response = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!response.ok) {
      console.error(`[Captcha] siteverify returned HTTP ${response.status}`);
      return {
        ok: false,
        code: "CAPTCHA_FAILED",
        message: "We could not verify the human check. Please try again.",
      };
    }

    const result = (await response.json()) as { success?: boolean };
    if (result.success !== true) {
      return {
        ok: false,
        code: "CAPTCHA_FAILED",
        message: "We could not verify the human check. Please try again.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[Captcha] verification request failed:", error);
    return {
      ok: false,
      code: "CAPTCHA_FAILED",
      message: "We could not verify the human check. Please try again.",
    };
  }
}
