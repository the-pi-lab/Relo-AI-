/**
 * Cryptographic security utilities for RELO
 * Built with Web Crypto API for Cloudflare Workers edge runtime.
 * Provides HMAC-SHA256 signature verification and AES-256-GCM encryption.
 */

/**
 * Constant-time string comparison to mitigate timing attacks.
 * Length mismatch no longer leaks early: both inputs are hashed to a
 * fixed-length digest before the constant-time compare.
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);

  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let result = 0;
  for (let i = 0; i < bytesA.length; i++) {
    result |= bytesA[i] ^ bytesB[i];
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
    .join("");

  return timingSafeEqual(expectedSignature, computedSignature);
}

/**
 * Timing-safe comparison for non-secret short strings (e.g. webhook verify
 * token handshake). Hashes both sides so length never leaks.
 */
export async function timingSafeEqualAsync(a: string, b: string): Promise<boolean> {
  return timingSafeEqual(a, b);
}

/**
 * Derives the AES-256-GCM key from the master key material using HKDF
 * (SHA-256) with a purpose-specific info label. HKDF with a salt hardens
 * against offline brute-force of low-entropy master keys compared to a
 * single unsalted SHA-256 round.
 */
async function deriveAesKeyV2(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "HKDF",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("relo-token-vault/v2"),
      info: encoder.encode("aes-256-gcm/instagram-access-token"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Legacy derivation (single unsalted SHA-256). Kept ONLY so ciphertexts
 * written before the HKDF upgrade remain decryptable during rotation.
 */
async function deriveAesKeyLegacy(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

const VERSION_PREFIX = "v2.";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 2. Encrypt sensitive token with AES-256-GCM (12-byte IV prepended)
 * Output: "v2." + Base64(IV || Ciphertext || AuthTag) — the version prefix
 * enables future key rotation without re-encrypting blindly.
 */
export async function encryptSecret(
  plaintext: string,
  masterKey: string
): Promise<string> {
  const key = await deriveAesKeyV2(masterKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return VERSION_PREFIX + bytesToBase64(combined);
}

/**
 * 3. Decrypt AES-256-GCM encrypted token.
 * Supports both the current "v2." HKDF envelope and legacy SHA-256-derived
 * ciphertexts (no prefix) so existing rows keep working until re-encrypted.
 */
export async function decryptSecret(
  encryptedBase64: string,
  masterKey: string
): Promise<string> {
  const isV2 = encryptedBase64.startsWith(VERSION_PREFIX);
  const payload = isV2 ? encryptedBase64.slice(VERSION_PREFIX.length) : encryptedBase64;
  const key = isV2
    ? await deriveAesKeyV2(masterKey)
    : await deriveAesKeyLegacy(masterKey);

  const combined = base64ToBytes(payload);

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

/**
 * Returns the AES master key used for the token vault. Hard-required:
 * falling back to the JWT secret would put sessions and stored Instagram
 * tokens behind the same secret — a key-reuse anti-pattern we refuse.
 *
 * Lives here (not in the router) because both the API and the DM engine need
 * it — the AI product-Q&A path decrypts a token to answer a question.
 */
export function getMasterKey(env: { ENCRYPTION_MASTER_KEY?: string }): string {
  const key = env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY is not configured. Set it as a Worker secret before operating the token vault."
    );
  }
  return key;
}
