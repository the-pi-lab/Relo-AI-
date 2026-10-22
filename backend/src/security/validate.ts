/**
 * Input hardening helpers.
 *
 * Two rules this module exists to enforce:
 *  1. Every byte a client sends is validated again on the server, with a
 *     schema, regardless of what the UI already checked.
 *  2. Anything that started as user input and later reaches HTML, CSV, or a
 *     redirect header is escaped at the point of output.
 */

/** Maximum accepted JSON body. Comfortably above every legitimate payload. */
export const MAX_JSON_BODY_BYTES = 256 * 1024;

/** Escapes text for interpolation into HTML text or a double-quoted attribute. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strips control characters (including NUL and CR/LF) that are used to break
 * log lines, split headers, or smuggle CSV rows. Newlines are preserved only
 * when `allowNewlines` is set (multi-line captions, support notes).
 */
export function stripControlChars(value: string, allowNewlines = false): string {
  const forbidden = allowNewlines
    ? // eslint-disable-next-line no-control-regex
      /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g
    : // eslint-disable-next-line no-control-regex
      /[\u0000-\u001F\u007F]/g;
  return value.replace(forbidden, "");
}

/** Trim + strip control characters + hard length cap. */
export function cleanText(value: unknown, maxLength: number, allowNewlines = false): string {
  if (value === null || value === undefined) return "";
  return stripControlChars(String(value), allowNewlines).trim().slice(0, maxLength);
}

/**
 * Returns the URL when it is an absolute http(s) URL, otherwise undefined.
 * Blocks `javascript:`, `data:`, `vbscript:`, protocol-relative `//host`, and
 * anything the URL parser rejects.
 */
export function safeHttpUrl(value: unknown, maxLength = 500): string | undefined {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > maxLength) return undefined;
  if (raw.startsWith("//")) return undefined;
  if (!/^https?:\/\//i.test(raw)) return undefined;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
    if (!parsed.hostname) return undefined;
    return parsed.toString().slice(0, maxLength);
  } catch {
    return undefined;
  }
}

/** Same as `safeHttpUrl` but https-only — used for anything a public page links to. */
export function safeHttpsUrl(value: unknown, maxLength = 500): string | undefined {
  const url = safeHttpUrl(value, maxLength);
  return url && url.startsWith("https://") ? url : undefined;
}

/** Integer clamped into a range; `fallback` for NaN/undefined. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

/** A single opaque identifier: no whitespace, no path separators, bounded. */
export function isSafeId(value: unknown, maxLength = 64): boolean {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > maxLength) return false;
  return /^[A-Za-z0-9_-]+$/.test(value);
}

/** True when the declared body is larger than we are willing to parse. */
export function exceedsBodyLimit(request: Request): boolean {
  const length = request.headers.get("content-length");
  if (!length) return false;
  const parsed = Number(length);
  return Number.isFinite(parsed) && parsed > MAX_JSON_BODY_BYTES;
}
