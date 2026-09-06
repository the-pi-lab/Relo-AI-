// Environment loading + validation. Fails fast on missing secrets so the
// backend never boots half-configured (a silent misconfiguration would look
// like "automation doesn't work" to the user).
import crypto from "node:crypto";

export const VERSION = "1.0.0";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function loadConfig() {
  const secrets = [
    process.env.META_APP_SECRET,
    process.env.FACEBOOK_APP_SECRET,
    process.env.INSTAGRAM_APP_SECRET,
  ].filter(Boolean);
  if (secrets.length === 0) {
    throw new Error(
      "Missing Meta app secret: set META_APP_SECRET (or FACEBOOK_APP_SECRET / INSTAGRAM_APP_SECRET)."
    );
  }

  const config = {
    version: VERSION,
    port: Number(process.env.PORT || 3000),
    databaseUrl: required("DATABASE_URL"),
    metaSecrets: secrets,
    graphHost: process.env.META_GRAPH_HOST || "graph.instagram.com",
    graphApiVersion: process.env.META_GRAPH_API_VERSION || "v25.0",
    webhookVerifyToken: required("WEBHOOK_VERIFY_TOKEN"),
    backendAuthToken: required("BACKEND_AUTH_TOKEN"),
    encryptionKey: process.env.ENCRYPTION_KEY || null,
    bootstrapAccount: {
      instagramId: process.env.IG_ACCOUNT_ID || null,
      username: process.env.IG_USERNAME || null,
      accessToken: process.env.META_ACCESS_TOKEN || null,
    },
    ai: {
      provider: (process.env.AI_PROVIDER || "none").toLowerCase(),
      openaiKey: process.env.OPENAI_API_KEY || null,
      openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      geminiKey: process.env.GEMINI_API_KEY || null,
      geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    },
    worker: {
      pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 2000),
      batchSize: 10,
      rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 750),
    },
  };

  if (config.encryptionKey && !/^[0-9a-fA-F]{64}$/.test(config.encryptionKey)) {
    throw new Error("ENCRYPTION_KEY must be 64 hex chars (32 bytes).");
  }
  if (!["none", "openai", "gemini"].includes(config.ai.provider)) {
    throw new Error("AI_PROVIDER must be one of: none, openai, gemini.");
  }
  if (
    config.ai.provider === "openai" &&
    !config.ai.openaiKey &&
    process.env.NODE_ENV === "production"
  ) {
    console.warn("[config] AI_PROVIDER=openai but OPENAI_API_KEY is missing.");
  }
  if (
    config.ai.provider === "gemini" &&
    !config.ai.geminiKey &&
    process.env.NODE_ENV === "production"
  ) {
    console.warn("[config] AI_PROVIDER=gemini but GEMINI_API_KEY is missing.");
  }
  if (!config.encryptionKey) {
    console.warn(
      "[config] ENCRYPTION_KEY not set — Instagram tokens will be stored " +
        "plaintext in YOUR database. Set it to enable AES-256-GCM encryption."
    );
  }

  return Object.freeze(config);
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
