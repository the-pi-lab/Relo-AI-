"use node";

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  decryptFromStorage,
  encryptForStorage,
  normalizeBackendUrl,
  pushConfigToBackendUrl,
  sha256Hex,
} from "./backendCrypto";

// Major version of customer-backend releases this control plane supports.
// Bump only when the config-push contract changes incompatibly.
const EXPECTED_BACKEND_MAJOR = "1";

function majorOf(version: string | null | undefined): string | null {
  if (!version) return null;
  const match = version.trim().match(/^(\d+)\./);
  return match ? match[1] : null;
}

interface CustomerFlow {
  id: string;
  name: string;
  is_active: boolean;
  post_id: string | null;
  match_any_post: boolean;
  keywords: string[];
  whole_word_match: boolean;
  dm_trigger_enabled: boolean;
  dm_message: string;
  public_reply_enabled: boolean;
  public_reply_message: string | null;
  require_follow: boolean;
  follow_prompt_message: string | null;
  ai_enabled: boolean;
  ai_prompt: string | null;
}

interface Registration {
  backendUrl: string;
  authTokenEnc: string;
  status: string;
}

/**
 * Map a Convex flow to the customer-backend contract.
 * Returns null when the flow cannot run remotely (no keywords / no message) —
 * the customer backend would reject it, so we skip it here and report it.
 */
function toCustomerFlow(flow: Doc<"flows">): CustomerFlow | null {
  const trigger = flow.trigger;
  const keywords = Array.isArray(trigger.keywords)
    ? trigger.keywords.filter(
        (k): k is string => typeof k === "string" && k.trim().length > 0
      )
    : [];
  const sendAction = flow.actions.find(
    (a) => a.type === "send_dm" || a.type === "send_reply"
  );
  const rawMessage = sendAction?.config?.message;
  const dmMessage =
    typeof rawMessage === "string" ? rawMessage.trim() : "";
  if (keywords.length === 0 || !dmMessage) return null;
  const aiEnabled = flow.ai?.enabled === true;
  const rawPrompt = typeof flow.ai?.prompt === "string" ? flow.ai.prompt.trim() : "";
  return {
    id: flow._id,
    name: flow.name,
    is_active: flow.status === "active",
    post_id: trigger.postId ?? null,
    match_any_post: !trigger.postId,
    keywords,
    // Convex has no whole-word toggle; the customer default (true) matches
    // OpenReply semantics and avoids accidental substring DMs.
    whole_word_match: true,
    dm_trigger_enabled: trigger.type === "instagram_dm",
    dm_message: dmMessage,
    // Legacy flows carry no public-reply config; remote defaults apply.
    // ai_enabled flows use the customer's own provider/key; the template
    // dm_message stays as the fallback when AI fails.
    public_reply_enabled: false,
    public_reply_message: null,
    require_follow: trigger.requireFollow === true,
    follow_prompt_message: null,
    ai_enabled: aiEnabled,
    ai_prompt: aiEnabled && rawPrompt ? rawPrompt.slice(0, 2000) : null,
  };
}

async function loadRegistration(
  ctx: ActionCtx,
  userId: Id<"users">
): Promise<Registration> {
  const reg = await ctx.runQuery(internal.backendRegistry.getRawRegistration, {
    userId,
  });
  if (!reg) throw new Error("No backend registered. Connect your backend first.");
  if (!reg.authTokenEnc) {
    throw new Error("Backend registration is missing its sealed token. Reconnect your backend.");
  }
  return { backendUrl: reg.backendUrl, authTokenEnc: reg.authTokenEnc, status: reg.status };
}

async function pushFlowsForUser(ctx: ActionCtx, userId: Id<"users">) {
  const reg = await loadRegistration(ctx, userId);
  const flows = await ctx.runQuery(internal.flows.listForSync, { userId });
  const mapped: CustomerFlow[] = [];
  let skipped = 0;
  for (const flow of flows) {
    const customer = toCustomerFlow(flow);
    if (customer) mapped.push(customer);
    else skipped += 1;
  }
  const authToken = decryptFromStorage(reg.authTokenEnc);
  const result = await pushConfigToBackendUrl(reg.backendUrl, authToken, {
    flows: mapped,
    igAccounts: [],
  });
  return { pushed: result.flows, skipped };
}

async function migrateTokensForUser(ctx: ActionCtx, userId: Id<"users">) {
  const integrations = await ctx.runQuery(internal.integrations.listAllForUser, {
    userId,
  });
  const withTokens = integrations.filter(
    (i) =>
      i.type === "instagram" &&
      typeof i.accessToken === "string" &&
      i.accessToken.length > 0
  );
  if (withTokens.length === 0) return { migrated: 0 };
  const reg = await loadRegistration(ctx, userId);
  const authToken = decryptFromStorage(reg.authTokenEnc);
  await pushConfigToBackendUrl(reg.backendUrl, authToken, {
    flows: [],
    igAccounts: withTokens.map((i) => ({
      instagramId: i.platformUserId,
      username: i.platformUsername ?? i.platformUserId,
      accessToken: i.accessToken as string,
    })),
  });
  for (const i of withTokens) {
    await ctx.runMutation(internal.integrations.clearToken, {
      integrationId: i._id,
    });
  }
  return { migrated: withTokens.length };
}

type VerifyResult =
  | { status: "offline"; error: string }
  | { status: "needs_attention"; error: string }
  | { status: "incompatible"; error: string }
  | {
      status: "connected";
      backendVersion: string | null;
      pushed: number;
      skipped: number;
      migrated: number;
    };

interface BackendHealth {
  ok?: unknown;
  db?: unknown;
  version?: unknown;
}

async function doVerify(ctx: ActionCtx, userId: Id<"users">): Promise<VerifyResult> {
  const reg = await loadRegistration(ctx, userId);
  const healthUrl = `${reg.backendUrl.replace(/\/+$/, "")}/health`;

  let health: BackendHealth | null = null;
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    health = (await response.json()) as BackendHealth;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ctx.runMutation(internal.backendRegistry.updateBackendStatus, {
      userId,
      status: "offline",
      lastError: `Health check failed: ${message}`,
    });
    return { status: "offline", error: `Backend unreachable: ${message}` };
  }

  const healthy = health !== null && health.ok === true && health.db === "up";
  if (!healthy) {
    const version =
      health !== null && typeof health.version === "string" ? health.version : undefined;
    await ctx.runMutation(internal.backendRegistry.updateBackendStatus, {
      userId,
      status: "needs_attention",
      backendVersion: version,
      lastError: "Backend reports unhealthy (ok=false or db down)",
    });
    return { status: "needs_attention", error: "Backend reports unhealthy" };
  }

  const version =
    health !== null && typeof health.version === "string" ? health.version : null;
  if (majorOf(version) !== EXPECTED_BACKEND_MAJOR) {
    await ctx.runMutation(internal.backendRegistry.updateBackendStatus, {
      userId,
      status: "incompatible",
      backendVersion: version ?? undefined,
      lastError: `Backend version ${version ?? "unknown"} is incompatible (expected v${EXPECTED_BACKEND_MAJOR}.x)`,
    });
    return { status: "incompatible", error: "Incompatible backend version" };
  }

  await ctx.runMutation(internal.backendRegistry.updateBackendStatus, {
    userId,
    status: "connected",
    backendVersion: version ?? undefined,
    lastError: undefined,
  });

  // Sync flows + migrate any centrally stored tokens now that the backend
  // is proven reachable. Push failures mark needs_attention (retryable).
  try {
    const { pushed, skipped } = await pushFlowsForUser(ctx, userId);
    const { migrated } = await migrateTokensForUser(ctx, userId);
    return { status: "connected", backendVersion: version, pushed, skipped, migrated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ctx.runMutation(internal.backendRegistry.updateBackendStatus, {
      userId,
      status: "needs_attention",
      backendVersion: version ?? undefined,
      lastError: message,
    });
    return { status: "needs_attention", error: message };
  }
}

/**
 * Register (or re-register) a customer backend, then verify it end-to-end:
 * health → version compat → flow sync → legacy token migration.
 * The raw auth token is sealed immediately and never persisted or logged.
 */
export const registerBackend = action({
  args: {
    backendUrl: v.string(),
    backendAuthToken: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    if (!args.backendAuthToken || args.backendAuthToken.length < 16) {
      throw new Error("Backend auth token looks invalid (minimum 16 characters)");
    }
    const backendUrl = normalizeBackendUrl(args.backendUrl);
    await ctx.runMutation(internal.backendRegistry.saveRegistration, {
      userId: authUserId as Id<"users">,
      backendUrl,
      provider: args.provider,
      authTokenHash: sha256Hex(args.backendAuthToken),
      authTokenEnc: encryptForStorage(args.backendAuthToken),
    });
    return await doVerify(ctx, authUserId as Id<"users">);
  },
});

/**
 * Disconnect the registered backend. Central execution resumes for any
 * centrally stored tokens; tokens already handed to the customer backend
 * stay there until rotated (disconnect cannot pull secrets back).
 */
export const disconnectBackend = action({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    await ctx.runMutation(internal.backendRegistry.removeRegistration, {
      userId: authUserId as Id<"users">,
    });
    return { ok: true };
  },
});

/** Re-run verification for the registered backend (dashboard "Retry" path). */
export const verifyBackend = action({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    return await doVerify(ctx, authUserId as Id<"users">);
  },
});

/** Push the user's current flows to their backend (no token material). */
export const pushFlows = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await pushFlowsForUser(ctx, args.userId);
  },
});

/**
 * Hand a freshly exchanged Meta token to the connected customer backend.
 * Throws when no backend is connected or the push fails — the caller must
 * NOT persist the token centrally in that case (retry OAuth instead).
 */
export const pushAccountToken = internalAction({
  args: {
    userId: v.id("users"),
    instagramId: v.string(),
    username: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const reg = await ctx.runQuery(internal.backendRegistry.getConnectedBackend, {
      userId: args.userId,
    });
    if (!reg || !reg.authTokenEnc) {
      throw new Error("No connected customer backend for token handoff");
    }
    const authToken = decryptFromStorage(reg.authTokenEnc);
    await pushConfigToBackendUrl(reg.backendUrl, authToken, {
      flows: [],
      igAccounts: [
        {
          instagramId: args.instagramId,
          username: args.username,
          accessToken: args.accessToken,
        },
      ],
    });
    return { success: true };
  },
});
