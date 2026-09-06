"use node";

/**
 * Control-plane secrets for the customer-backend channel.
 *
 * What lives here:
 * - BACKEND_AUTH_TOKEN sealed with BACKEND_TOKEN_KEY (AES-256-GCM). This lets
 *   the control plane proxy config pushes server-to-server so the browser
 *   never holds the token. It is scoped to config-push only and revocable by
 *   regenerating it at the customer backend.
 *
 * What NEVER lives here: Meta access tokens, AI API keys, database/Redis
 * credentials. Those stay inside the customer's infrastructure.
 */

import crypto from "node:crypto";

const PREFIX = "enc:";

function backendKey(): Buffer {
  const hex = process.env.BACKEND_TOKEN_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "BACKEND_TOKEN_KEY must be set to 64 hex chars (32 bytes) in the Convex environment."
    );
  }
  return Buffer.from(hex, "hex");
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function encryptForStorage(plaintext: string): string {
  const key = backendKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

export function decryptFromStorage(stored: string): string {
  if (!stored.startsWith(PREFIX)) throw new Error("Unknown sealed-token format");
  const combined = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = combined.subarray(0, 12);
  const tag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", backendKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8"
  );
}

/** POST a config payload to the customer backend with Bearer auth. */
export async function pushConfigToBackendUrl(
  backendUrl: string,
  authToken: string,
  body: unknown
): Promise<{ flows: number; igAccounts: number }> {
  const url = `${backendUrl.replace(/\/+$/, "")}/api/config/push`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(
      `Customer backend unreachable at ${backendUrl}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Customer backend rejected config push (${response.status}): ${detail.slice(0, 200)}`
    );
  }
  return (await response.json()) as { flows: number; igAccounts: number };
}

/** Validate a user-supplied backend URL (https, or http for local dev). */
export function normalizeBackendUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Backend URL is not a valid URL");
  }
  if (url.username || url.password) {
    throw new Error("Backend URL must not embed credentials");
  }
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
    throw new Error("Backend URL must use https (http is allowed for localhost only)");
  }
  return url.origin;
}
