import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const PLAN_TYPES = {
  FREE: "free",
  PRO: "pro",
  ULTIMATE: "ultimate",
  BUSINESS: "business",
} as const;

export const planTypeValidator = v.union(
  v.literal(PLAN_TYPES.FREE),
  v.literal(PLAN_TYPES.PRO),
  v.literal(PLAN_TYPES.ULTIMATE),
  v.literal(PLAN_TYPES.BUSINESS),
);

export const INTEGRATION_TYPES = {
  INSTAGRAM: "instagram",
  WHATSAPP: "whatsapp",
} as const;

export const integrationTypeValidator = v.union(
  v.literal(INTEGRATION_TYPES.INSTAGRAM),
  v.literal(INTEGRATION_TYPES.WHATSAPP),
);

export const FLOW_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  DRAFT: "draft",
} as const;

export const flowStatusValidator = v.union(
  v.literal(FLOW_STATUS.ACTIVE),
  v.literal(FLOW_STATUS.PAUSED),
  v.literal(FLOW_STATUS.DRAFT),
);

export const TRIGGER_TYPES = {
  INSTAGRAM_COMMENT: "instagram_comment",
  INSTAGRAM_DM: "instagram_dm",
  INSTAGRAM_STORY_MENTION: "instagram_story_mention",
  INSTAGRAM_STORY_REPLY: "instagram_story_reply",
  WHATSAPP_MESSAGE: "whatsapp_message",
  KEYWORD: "keyword",
  SCHEDULE: "schedule",
} as const;

export const triggerTypeValidator = v.union(
  v.literal(TRIGGER_TYPES.INSTAGRAM_COMMENT),
  v.literal(TRIGGER_TYPES.INSTAGRAM_DM),
  v.literal(TRIGGER_TYPES.INSTAGRAM_STORY_MENTION),
  v.literal(TRIGGER_TYPES.INSTAGRAM_STORY_REPLY),
  v.literal(TRIGGER_TYPES.WHATSAPP_MESSAGE),
  v.literal(TRIGGER_TYPES.KEYWORD),
  v.literal(TRIGGER_TYPES.SCHEDULE),
);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      
      // Subscription info
      planType: v.optional(planTypeValidator),
      planStartDate: v.optional(v.number()),
      planEndDate: v.optional(v.number()),
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      
      // Usage tracking
      messagesUsedToday: v.optional(v.number()),
      lifetimeMessagesSent: v.optional(v.number()),
      lastResetDate: v.optional(v.string()),
      
      // Payment info
      razorpayOrderId: v.optional(v.string()),
      razorpayPaymentId: v.optional(v.string()),
      lastPaymentDate: v.optional(v.number()),
    }).index("email", ["email"]),

    // One-time license entitlements (v2 commercial model).
    // Stores ONLY license state — never Meta/AI secrets.
    // userId is unset until redemption (key issued unbound, like a gift card).
    licenses: defineTable({
      userId: v.optional(v.id("users")),
      licenseKey: v.string(),
      status: v.union(
        v.literal("active"),
        v.literal("revoked"),
        v.literal("refunded")
      ),
      issuedAt: v.number(),
      revokedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_key", ["licenseKey"]),

    // Registry of customer-owned backends (thin control plane).
    // Stores the endpoint + auth-token HASH for config pushes and status
    // checks. Never stores Meta tokens, AI keys, or database credentials.
    backendRegistry: defineTable({
      userId: v.id("users"),
      backendUrl: v.string(),
      // Hosting-provider id from the managed-providers registry ("railway",
      // "render", "supabase-db", "fly") or "custom" for BYO setups.
      provider: v.optional(v.string()),
      authTokenHash: v.string(),
      // AES-256-GCM encrypted BACKEND_AUTH_TOKEN ("enc:<base64>"), sealed with
      // the control-plane BACKEND_TOKEN_KEY. Lets the control plane proxy
      // config pushes server-to-server so the browser never holds the token.
      // Scoped to config-push only; Meta/AI/DB secrets are NEVER stored here.
      authTokenEnc: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("connected"),
        v.literal("needs_attention"),
        v.literal("offline"),
        v.literal("incompatible")
      ),
      backendVersion: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
    })
      .index("by_user", ["userId"]),

    // Social media integrations
    // Phase 5: accessToken is optional. When a customer backend is connected,
    // the Meta token is handed to that backend at OAuth time (or migrated at
    // verify time) and NEVER persisted here — the row keeps identity
    // (platformUserId/username) for routing and display only.
    integrations: defineTable({
      userId: v.id("users"),
      type: integrationTypeValidator,

      // Meta OAuth token (legacy path only: present solely while NO customer
      // backend is connected; cleared on handoff/migration).
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      
      // Platform-specific IDs
      platformUserId: v.string(),
      platformUsername: v.optional(v.string()),
      
      // WhatsApp specific
      phoneNumberId: v.optional(v.string()),
      businessAccountId: v.optional(v.string()),
      
      isActive: v.boolean(),
      
      // Token management
      lastTokenRefresh: v.optional(v.number()),
      needsReauth: v.optional(v.boolean()),
      lastError: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_type", ["userId", "type"]),

    // Instagram media cache
    instagramMedia: defineTable({
      userId: v.id("users"),
      mediaId: v.string(),
      caption: v.string(),
      mediaType: v.string(),
      mediaUrl: v.string(),
      thumbnailUrl: v.optional(v.string()),
      permalink: v.string(),
      timestamp: v.string(),
      likeCount: v.number(),
      commentsCount: v.number(),
      lastFetched: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_media_id", ["mediaId"]),

    // Automation flows
    // ai is optional per flow: when enabled, the customer backend generates
    // the reply with the user's own provider/key; otherwise the template
    // dm_message is sent and AI is never invoked.
    flows: defineTable({
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      status: flowStatusValidator,

      ai: v.optional(v.object({
        enabled: v.boolean(),
        prompt: v.optional(v.string()),
      })),

      trigger: v.object({
        type: triggerTypeValidator,
        keywords: v.optional(v.array(v.string())),
        conditions: v.optional(v.any()),
        postId: v.optional(v.string()),
        scheduleTime: v.optional(v.string()),
        requireFollow: v.optional(v.boolean()),
      }),
      
      actions: v.array(v.object({
        type: v.string(),
        config: v.any(),
      })),
      
      totalExecutions: v.optional(v.number()),
      successfulExecutions: v.optional(v.number()),
      failedExecutions: v.optional(v.number()),
      lastExecutedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_status", ["userId", "status"]),

    // Broadcast campaigns
    broadcasts: defineTable({
      userId: v.id("users"),
      name: v.string(),
      message: v.string(),
      platform: integrationTypeValidator,
      
      targetAudience: v.optional(v.object({
        tags: v.optional(v.array(v.string())),
        segments: v.optional(v.array(v.string())),
        excludeTags: v.optional(v.array(v.string())),
      })),
      
      scheduledFor: v.optional(v.number()),
      status: v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("completed"),
        v.literal("failed")
      ),
      
      totalRecipients: v.optional(v.number()),
      sentCount: v.optional(v.number()),
      deliveredCount: v.optional(v.number()),
      failedCount: v.optional(v.number()),
      openedCount: v.optional(v.number()),
      clickedCount: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_status", ["userId", "status"]),

    // Contact tags and segments
    contacts: defineTable({
      userId: v.id("users"),
      platform: integrationTypeValidator,
      platformUserId: v.string(),
      username: v.optional(v.string()),
      
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      
      tags: v.array(v.string()),
      customFields: v.optional(v.any()),
      
      lastInteractionAt: v.optional(v.number()),
      totalMessages: v.optional(v.number()),
      isSubscribed: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_platform", ["userId", "platform"])
      .index("by_platform_user", ["platformUserId"]),

    // Sequences (drip campaigns)
    sequences: defineTable({
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      status: flowStatusValidator,
      
      steps: v.array(v.object({
        delay: v.number(),
        message: v.string(),
        mediaUrl: v.optional(v.string()),
        buttons: v.optional(v.array(v.object({
          text: v.string(),
          action: v.string(),
        }))),
      })),
      
      totalSubscribers: v.optional(v.number()),
      activeSubscribers: v.optional(v.number()),
      completedSubscribers: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_status", ["userId", "status"]),

    // Sequence subscriptions
    sequenceSubscriptions: defineTable({
      sequenceId: v.id("sequences"),
      contactId: v.id("contacts"),
      currentStep: v.number(),
      status: v.union(
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed"),
        v.literal("unsubscribed")
      ),
      nextStepAt: v.optional(v.number()),
    })
      .index("by_sequence", ["sequenceId"])
      .index("by_contact", ["contactId"])
      .index("by_next_step", ["nextStepAt"]),

    // Product catalog
    products: defineTable({
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      currency: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      tags: v.array(v.string()),
      sku: v.optional(v.string()),
      inStock: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"])
      .searchIndex("search_products", {
        searchField: "name",
        filterFields: ["userId", "tags"],
      }),

    // Message logs
    messages: defineTable({
      userId: v.id("users"),
      flowId: v.optional(v.id("flows")),
      
      platform: integrationTypeValidator,
      direction: v.union(v.literal("inbound"), v.literal("outbound")),
      
      recipientId: v.string(),
      recipientUsername: v.optional(v.string()),
      
      messageType: v.string(),
      content: v.string(),
      mediaUrl: v.optional(v.string()),
      
      status: v.union(
        v.literal("queued"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("failed"),
        v.literal("read")
      ),
      errorMessage: v.optional(v.string()),
      
      postId: v.optional(v.string()),
      commentId: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_flow", ["userId", "flowId"])
      .index("by_user_and_platform", ["userId", "platform"]),

    // Analytics aggregations
    analytics: defineTable({
      userId: v.id("users"),
      date: v.string(),
      
      totalMessages: v.number(),
      sentMessages: v.number(),
      deliveredMessages: v.number(),
      failedMessages: v.number(),
      
      instagramMessages: v.number(),
      whatsappMessages: v.number(),
      
      flowExecutions: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_date", ["userId", "date"]),

    // Webhook events (for debugging)
    // dedupeKey (e.g. "ig-comment:<userId>:<commentId>") makes Meta
    // redeliveries idempotent: the Phase 4 migration guard drops repeats
    // before any flow execution is scheduled.
    webhookEvents: defineTable({
      userId: v.optional(v.id("users")),
      platform: integrationTypeValidator,
      eventType: v.string(),
      payload: v.any(),
      processed: v.boolean(),
      processedAt: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      dedupeKey: v.optional(v.string()),
    })
      .index("by_processed", ["processed"])
      .index("by_user", ["userId"])
      .index("by_dedupe", ["dedupeKey"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;