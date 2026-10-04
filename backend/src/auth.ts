import type { UserId } from "./types/ids";
import { createUserId } from "./types/ids";

export interface JwtPayload {
  sub: UserId;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Base64Url string encoding according to RFC 7515
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Base64Url string decoding
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

/**
 * Derives HMAC-SHA256 CryptoKey from string secret using Web Crypto API
 */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a JWT using Web Crypto HMAC-SHA256 (HS256)
 */
export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput)
  );

  let binarySig = "";
  const bytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binarySig += String.fromCharCode(bytes[i]);
  }
  const encodedSig = base64UrlEncode(binarySig);

  return `${signingInput}.${encodedSig}`;
}

/**
 * Verifies and decodes a signed JWT using Web Crypto API
 */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  try {
    // Reject tokens whose declared algorithm is not HS256 (algorithm confusion)
    const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string };
    if (header.alg !== "HS256") return null;

    const key = await getHmacKey(secret);
    const encoder = new TextEncoder();

    // Decode signature
    const binarySig = base64UrlDecode(encodedSignature);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(signingInput)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: JwtPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    // Tokens without a hard expiry are rejected — never accept immortal tokens
    if (typeof payload.exp !== "number" || payload.exp < now - 60) {
      return null;
    }
    if (typeof payload.iat === "number" && payload.iat > now + 300) {
      // Issued in the future beyond clock-skew tolerance
      return null;
    }

    return {
      sub: createUserId(payload.sub),
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Generates a secure 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  const codeNum = 100000 + (values[0] % 900000);
  return codeNum.toString();
}

/**
 * Sends a 6-digit login OTP code via Resend Email API.
 * Failures propagate to the caller so the API never reports success when
 * no email went out — and the raw code is NEVER returned to HTTP clients.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  resendApiKey?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    console.log(`[Auth Dev Mode] Generated OTP for ${email}: ${code}`);
    return { success: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RELO <auth@relo.ai>",
        to: [email],
        subject: `Your RELO Login Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-top: 0;">Sign in to RELO</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5;">Enter the following 6-digit verification code to access your Creator Studio:</p>
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0284c7;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you did not request this login code, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`[Resend Warning] Failed to send email to ${email}. Status: ${res.status}. ${detail}`);
      return { success: false, error: `Email delivery failed (HTTP ${res.status})` };
    }

    return { success: true };
  } catch (err) {
    console.warn(`[Resend Error] Network failure:`, err);
    return { success: false, error: "Email delivery failed (network error)" };
  }
}
