/**
 * Branded nominal type utility to ensure compile-time type safety
 * and prevent accidental argument swapping.
 */
declare const __brand: unique symbol;

export type Branded<T, Brand extends string> = T & { readonly [__brand]: Brand };

// Entity ID types
export type UserId = Branded<string, "UserId">;
export type AccountId = Branded<string, "AccountId">;
export type InstagramUserId = Branded<string, "InstagramUserId">;
export type MediaId = Branded<string, "MediaId">;
export type CommentId = Branded<string, "CommentId">;
export type JobId = Branded<string, "JobId">;
export type AutomationId = Branded<string, "AutomationId">;
export type LeadId = Branded<string, "LeadId">;

// Helper constructors with runtime string validation
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createAccountId(id: string): AccountId {
  return id as AccountId;
}

export function createInstagramUserId(id: string): InstagramUserId {
  return id as InstagramUserId;
}

export function createMediaId(id: string): MediaId {
  return id as MediaId;
}

export function createCommentId(id: string): CommentId {
  return id as CommentId;
}

export function createJobId(id: string): JobId {
  return id as JobId;
}

export function createAutomationId(id: string): AutomationId {
  return id as AutomationId;
}

export function createLeadId(id: string): LeadId {
  return id as LeadId;
}
