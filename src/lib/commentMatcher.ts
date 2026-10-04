/**
 * Comment trigger matching — a faithful port of the engine's matcher
 * (backend/src/engine/keyword.ts) so the editor's "preview as commenter"
 * panel tells the truth about what will actually fire.
 *
 * Both sides use Unicode whole-word boundaries and Latin diacritic folding;
 * keep the two implementations in lockstep.
 */

/** NFD-decompose, strip Latin diacritics, lowercase, collapse whitespace. */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Unicode-aware whole-word pattern; internal spaces match one-or-more spaces. */
export function buildKeywordRegex(keyword: string): RegExp {
  const normalized = normalizeText(keyword);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return /^$/;
  const escapedPattern = words.map(escapeRegex).join("\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapedPattern}(?![\\p{L}\\p{N}])`, "u");
}

/** True when the keyword list contains the "*" catch-all. */
export function isCatchAll(keywords: string[]): boolean {
  return keywords.some((k) => k.trim() === "*");
}

export function matchesKeyword(commentText: string, keyword: string): boolean {
  if (!keyword || !commentText) return false;
  if (keyword.trim() === "*") return true;
  return buildKeywordRegex(keyword).test(normalizeText(commentText));
}

/** First matching keyword ("*" for catch-all), or null when nothing matches. */
export function findMatchingKeyword(
  commentText: string,
  keywords: string[]
): string | null {
  if (!commentText || !keywords || keywords.length === 0) return null;
  if (isCatchAll(keywords)) return "*";
  const normalized = normalizeText(commentText);
  for (const keyword of keywords) {
    const trimmed = keyword.trim();
    if (!trimmed) continue;
    if (buildKeywordRegex(trimmed).test(normalized)) return trimmed;
  }
  return null;
}

/** Merge @username into a reply template (case-insensitive, global). */
export function mergeUsername(template: string, username: string): string {
  return template.replace(/@username/gi, `@${username}`);
}