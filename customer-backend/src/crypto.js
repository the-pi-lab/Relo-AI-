// Auth + token-protection helpers. Secrets never leave this backend:
// - BACKEND_AUTH_TOKEN compared timing-safe, never logged.
// - Instagram tokens stored as "enc:<...>" (AES-256-GCM) when ENCRYPTION_KEY
//   is set, else "plain:<...>" with a boot warning (see config.js).
import crypto from "node:crypto";

export function timingSafeEqualStr(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Express middleware: requires `Authorization: Bearer <BACKEND_AUTH_TOKEN>`. */
export function requireBackendAuth(getToken) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!presented || !timingSafeEqualStr(presented, getToken())) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    next();
  };
}

/** Verify Meta's x-hub-signature-256 header against the RAW request body. */
export function verifyWebhookSignature(rawBody, signature, secrets) {
  if (!signature || !rawBody || secrets.length === 0) return false;
  return secrets.some((secret) => {
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return timingSafeEqualStr(signature, expected);
  });
}

const ALGO = "aes-256-gcm";

function encryptionKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) return null;
  return Buffer.from(hex, "hex");
}

/** Wrap a plaintext secret for storage. */
export function protectSecret(plaintext) {
  const key = encryptionKey();
  if (!key) return `plain:${plaintext}`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

/** Unwrap a stored secret. Throws on tampered/corrupt ciphertext. */
export function revealSecret(stored) {
  if (stored.startsWith("plain:")) return stored.slice("plain:".length);
  if (!stored.startsWith("enc:")) throw new Error("Unknown secret format");
  const key = encryptionKey();
  if (!key) throw new Error("ENCRYPTION_KEY is required to decrypt secrets");
  const combined = Buffer.from(stored.slice("enc:".length), "base64");
  const iv = combined.subarray(0, 12);
  const tag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8"
  );
}
