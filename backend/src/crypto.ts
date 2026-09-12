/**
 * Cryptographic security utilities for RELO
 * Built with Web Crypto API for Cloudflare Workers edge runtime.
 * Provides HMAC-SHA256 signature verification and AES-256-GCM encryption.
 */

/**
 * Constant-time string comparison to mitigate timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 1. Verify Meta Graph API Webhook signature (X-Hub-Signature-256)
 * Format: "sha256=<hex_digest>"
 */
export async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader || !appSecret) return false;
  if (!signatureHeader.startsWith("sha256=")) return false;

  const expectedSignature = signatureHeader.slice(7).toLowerCase();

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );

  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase();

  return timingSafeEqual(expectedSignature, computedSignature);
}

/**
 * Derive 256-bit AES-GCM CryptoKey from string secret using SHA-256
 */
async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * 2. Encrypt sensitive token with AES-256-GCM (12-byte IV prepended)
 * Output: Base64 string of (IV + Ciphertext + AuthTag)
 */
export async function encryptSecret(
  plaintext: string,
  masterKey: string
): Promise<string> {
  const key = await deriveAesKey(masterKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV (12 bytes) and ciphertext
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // Convert to Base64
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * 3. Decrypt AES-256-GCM encrypted token
 */
export async function decryptSecret(
  encryptedBase64: string,
  masterKey: string
): Promise<string> {
  const key = await deriveAesKey(masterKey);
  const binary = atob(encryptedBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}
