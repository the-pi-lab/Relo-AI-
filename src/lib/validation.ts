/**
 * Security validation utilities for frontend inputs
 */

/**
 * Validates that an action button URL uses strict http/https protocols.
 * Blocks dangerous schemes (javascript:, data:, vbscript:) preventing XSS vulnerabilities.
 */
export const isValidButtonUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Sanitizes and normalizes trigger keywords (strips extra whitespace, uppercase, strips #)
 */
export const normalizeTriggerKeyword = (keyword: string): string => {
  if (!keyword) return "";
  return keyword.trim().replace(/^#+/, "").toUpperCase();
};
