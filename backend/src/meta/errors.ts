/**
 * Typed Meta Graph API Error Hierarchy & Classification Engine
 * Compliant with Meta Graph API v21.0 error codes and subcodes.
 */

export interface MetaRawErrorPayload {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    is_transient?: boolean;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
    [key: string]: unknown;
  };
}

/**
 * Base error class for all Meta Graph API errors
 */
export class MetaApiError extends Error {
  public readonly code: number;
  public readonly subcode?: number;
  public readonly errorType?: string;
  public readonly fbtraceId?: string;
  public readonly statusCode: number;
  public readonly isTransient: boolean;
  public readonly rawError?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: number;
      subcode?: number;
      errorType?: string;
      fbtraceId?: string;
      statusCode: number;
      isTransient?: boolean;
      rawError?: Record<string, unknown>;
    }
  ) {
    super(`[Meta Graph API ${options.statusCode}] (Code ${options.code}${options.subcode ? `:${options.subcode}` : ""}) ${message}`);
    this.name = "MetaApiError";
    this.code = options.code;
    this.subcode = options.subcode;
    this.errorType = options.errorType;
    this.fbtraceId = options.fbtraceId;
    this.statusCode = options.statusCode;
    this.isTransient = options.isTransient ?? false;
    this.rawError = options.rawError;
  }
}

/**
 * Thrown when an Instagram User/Page access token has expired or been revoked.
 * Code: 190. Subcodes: 458, 459, 460, 463, 467.
 */
export class TokenExpiredError extends MetaApiError {
  constructor(message: string, options: ConstructorParameters<typeof MetaApiError>[1]) {
    super(message, options);
    this.name = "TokenExpiredError";
  }
}

/**
 * Thrown when API call rate limits are exceeded or action is blocked.
 * Standard rate limits: Code 4, 17, 32, 613.
 * Instagram Action Block: Code 368.
 */
export class RateLimitError extends MetaApiError {
  public readonly isActionBlocked: boolean;

  constructor(
    message: string,
    options: ConstructorParameters<typeof MetaApiError>[1] & { isActionBlocked?: boolean }
  ) {
    super(message, options);
    this.name = "RateLimitError";
    this.isActionBlocked = options.isActionBlocked ?? options.code === 368;
  }
}

/**
 * Thrown when access token lacks required permissions (e.g. instagram_manage_comments, pages_messaging).
 * Code: 10, 200..299.
 */
export class PermissionError extends MetaApiError {
  constructor(message: string, options: ConstructorParameters<typeof MetaApiError>[1]) {
    super(message, options);
    this.name = "PermissionError";
  }
}

/**
 * Thrown when the referenced comment, post, or media was deleted or cannot be found.
 * Code: 100, Subcode: 33.
 */
export class ResourceNotFoundError extends MetaApiError {
  constructor(message: string, options: ConstructorParameters<typeof MetaApiError>[1]) {
    super(message, options);
    this.name = "ResourceNotFoundError";
  }
}

/**
 * Thrown when Instagram user cannot be messaged (outside 24hr window, privacy settings, account private).
 */
export class UserNotReachableError extends MetaApiError {
  constructor(message: string, options: ConstructorParameters<typeof MetaApiError>[1]) {
    super(message, options);
    this.name = "UserNotReachableError";
  }
}

/**
 * Factory that classifies a raw Meta API HTTP response and constructs
 * the appropriate typed Meta error instance.
 */
export function parseMetaError(statusCode: number, body: unknown): MetaApiError {
  const payload = (typeof body === "object" && body !== null ? body : {}) as MetaRawErrorPayload;
  const err = payload.error || {};

  const message = err.message || `Meta API request failed with HTTP ${statusCode}`;
  const code = typeof err.code === "number" ? err.code : statusCode;
  const subcode = typeof err.error_subcode === "number" ? err.error_subcode : undefined;
  const errorType = err.type;
  const fbtraceId = err.fbtrace_id;
  const isTransient = Boolean(err.is_transient);

  const baseOptions = {
    code,
    subcode,
    errorType,
    fbtraceId,
    statusCode,
    isTransient,
    rawError: err as Record<string, unknown>,
  };

  // 1. Token Expired / Invalid
  if (code === 190 || (subcode && [458, 459, 460, 463, 467].includes(subcode))) {
    return new TokenExpiredError(message, baseOptions);
  }

  // 2. Rate Limits & Action Blocks
  if ([4, 17, 32, 613, 368].includes(code)) {
    return new RateLimitError(message, {
      ...baseOptions,
      isActionBlocked: code === 368,
    });
  }

  // 3. Permission denied
  if (code === 10 || (code >= 200 && code < 300)) {
    return new PermissionError(message, baseOptions);
  }

  // 4. Resource Not Found (Comment or Media deleted)
  if (code === 100 && subcode === 33) {
    return new ResourceNotFoundError(message, baseOptions);
  }

  // 5. User Not Reachable
  if (
    code === 100 &&
    (subcode === 2018001 || subcode === 2018028 || message.toLowerCase().includes("cannot send message to this user"))
  ) {
    return new UserNotReachableError(message, baseOptions);
  }

  return new MetaApiError(message, baseOptions);
}

/**
 * Classifies whether a failure can be retried by the Cron-as-Queue worker.
 * Returns `false` for non-recoverable errors (e.g. deleted comments, expired tokens, action blocks).
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof MetaApiError)) {
    // Unknown network errors (fetch abort / DNS / 5xx) are generally retryable
    return true;
  }

  // Token is expired -> Cannot succeed without user re-auth
  if (error instanceof TokenExpiredError) {
    return false;
  }

  // Comment or post was deleted by user -> Never retry
  if (error instanceof ResourceNotFoundError) {
    return false;
  }

  // Recipient cannot receive message -> Never retry
  if (error instanceof UserNotReachableError) {
    return false;
  }

  // Action block (Code 368) -> Account is restricted by Instagram, do not spam retries
  if (error instanceof RateLimitError && error.isActionBlocked) {
    return false;
  }

  // Standard rate limit (Code 4, 17, 32, 613) -> Retryable after cooldown
  if (error instanceof RateLimitError) {
    return true;
  }

  // Explicitly marked transient by Meta
  if (error.isTransient) {
    return true;
  }

  // HTTP 5xx server-side errors from Meta are retryable
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // HTTP 429 Too Many Requests
  if (error.statusCode === 429) {
    return true;
  }

  return false;
}
