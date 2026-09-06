// Official Instagram Graph API client (Instagram Login endpoints).
// Endpoint shapes follow the proven OpenReply implementation (MIT).
// Access tokens are passed via Bearer header — URLs stay token-free so error
// logs can never leak them.

export class MetaApiError extends Error {
  constructor(code, subcode, message) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.subcode = subcode;
  }
}

export class TokenExpiredError extends MetaApiError {
  constructor(message) {
    super(190, undefined, message);
    this.name = "TokenExpiredError";
  }
}

export class RateLimitError extends MetaApiError {
  constructor(message) {
    super(368, undefined, message);
    this.name = "RateLimitError";
  }
}

export class PermissionError extends MetaApiError {
  constructor(message) {
    super(100, undefined, message);
    this.name = "PermissionError";
  }
}

function base() {
  // META_GRAPH_PROTOCOL exists solely for tests (plain-HTTP stub server).
  // Production always uses https.
  const protocol = process.env.META_GRAPH_PROTOCOL || "https";
  const host = process.env.META_GRAPH_HOST || "graph.instagram.com";
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  return `${protocol}://${host}/${version}`;
}

/** Terminal (non-retryable) failure signatures for private replies. */
const TERMINAL_PATTERNS = [
  /invalid for a private reply/i,
  /already replied/i,
  /does not exist/i,
  /not found/i,
  /outside of allowed window/i,
  /permission/i,
];

/** True when the job deserves a retry with backoff (rate limit / 5xx / net). */
export function isRetryable(err) {
  if (err instanceof RateLimitError) return true;
  if (err instanceof TokenExpiredError) return false;
  if (err instanceof PermissionError) return false;
  if (err instanceof MetaApiError) {
    if (TERMINAL_PATTERNS.some((re) => re.test(err.message))) return false;
    if (err.code >= 500) return true;
    return false;
  }
  // Network / timeout / unknown fetch failures: retry.
  return true;
}

async function handleResponse(response, path) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new MetaApiError(response.status, undefined, `Non-JSON response (${path})`);
  }
  if (!response.ok || data?.error) {
    const err = data?.error || {};
    const code = err.code ?? response.status;
    const message = `${err.message ?? "Unknown Meta API error"} (${path}) [code=${code} sub=${err.error_subcode ?? "-"}]`;
    if (code === 190) throw new TokenExpiredError(message);
    if (code === 368 || code === 4 || code === 17) {
      throw new RateLimitError(message);
    }
    if (code === 10 || code === 100 || code === 200) {
      throw new PermissionError(message);
    }
    throw new MetaApiError(code, err.error_subcode, message);
  }
  return data;
}

async function postJson(path, token, body) {
  const response = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    // Without a timeout a hung socket stalls the worker slot forever: the
    // job sits in "processing" and is never retried nor completed.
    signal: AbortSignal.timeout(30_000),
  });
  return handleResponse(response, path);
}

/** Private reply to a comment (consumes the comment's single reply slot). */
export function sendPrivateReply(token, igAccountId, commentId, message) {
  return postJson(`/${igAccountId}/messages`, token, {
    recipient: { comment_id: commentId },
    message: { text: message },
  });
}

/** Public reply under a comment (independent of the DM leg). */
export function sendCommentReply(token, commentId, message) {
  return postJson(`/${commentId}/replies`, token, { message });
}

/** Plain-text DM to a user (conversation already open). */
export function sendDirectMessage(token, igAccountId, userId, message) {
  return postJson(`/${igAccountId}/messages`, token, {
    recipient: { id: userId },
    message: { text: message },
  });
}

/**
 * Follow check via the Messaging profile API. Returns true/false, or null
 * when Meta doesn't return the field (callers fail OPEN on taps, CLOSED on
 * first contact — see engine.js).
 */
export async function getUserFollowStatus(token, userId) {
  try {
    const url = new URL(`${base()}/${userId}`);
    url.searchParams.set("fields", "is_user_follow_business");
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.is_user_follow_business === "boolean"
      ? data.is_user_follow_business
      : null;
  } catch {
    return null;
  }
}
