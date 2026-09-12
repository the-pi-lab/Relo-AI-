import type { AccountId, CommentId, InstagramUserId, MediaId } from "./ids";

/**
 * Meta Graph API v21.0 Webhook Event Payloads
 */
export interface MetaWebhookEntry {
  id: string; // Instagram Account ID
  time: number;
  changes?: MetaWebhookChange[];
  messaging?: MetaWebhookMessaging[];
}

export interface MetaWebhookChange {
  field: "comments" | string;
  value: {
    id: string; // comment id
    comment_id?: string;
    text?: string;
    from: {
      id: string; // commenter Instagram Scoped ID
      username: string;
    };
    media?: {
      id: string;
    };
    media_id?: string;
    created_time?: number;
  };
}

export interface MetaWebhookMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
    is_unsupported?: boolean;
    quick_reply?: {
      payload: string;
    };
  };
}

export interface MetaWebhookEnvelope {
  object: "instagram";
  entry: MetaWebhookEntry[];
}

/**
 * Meta Official Generic Template Button Types
 */
export type WebUrlButton = {
  type: "web_url";
  url: string;
  title: string;
};

export type PostbackButton = {
  type: "postback";
  title: string;
  payload: string;
};

export type PhoneButton = {
  type: "phone_number";
  title: string;
  payload: string;
};

export type GenericTemplateButton = WebUrlButton | PostbackButton | PhoneButton;

/**
 * Meta Generic Template Element (1 to 10 elements per message)
 * Each element supports up to 3 buttons max.
 */
export interface GenericTemplateElement {
  title: string; // max 80 chars
  subtitle?: string; // max 80 chars
  image_url?: string;
  default_action?: {
    type: "web_url";
    url: string;
  };
  buttons?: [GenericTemplateButton, ...GenericTemplateButton[]]; // 1 to 3 buttons max
}

export interface GenericTemplatePayload {
  recipient: { comment_id?: string; id?: string };
  message: {
    attachment: {
      type: "template";
      payload: {
        template_type: "generic";
        elements: [GenericTemplateElement, ...GenericTemplateElement[]];
      };
    };
  };
}

export interface PlainTextPayload {
  recipient: { comment_id?: string; id?: string };
  message: {
    text: string;
  };
}

export type OutgoingMessagePayload = GenericTemplatePayload | PlainTextPayload;

/**
 * Biometric Follow-Gate Decision States
 */
export type FollowGateDecision =
  | "ALLOW_VERIFIED_FOLLOWER"
  | "ALLOW_FAIL_OPEN"
  | "PROMPT_FOLLOW";

export interface FollowStatusResult {
  isFollowing: boolean | null;
  latencyMs: number;
  decision: FollowGateDecision;
}
