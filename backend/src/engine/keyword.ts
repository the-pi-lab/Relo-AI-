/**
 * Keyword Matching Engine with Unicode Whole-Word Boundaries & Latin Diacritic Folding.
 * Inspired by OpenReply's proven battle-tested comment parser.
 */

/**
 * Normalizes text by:
 * 1. Performing Unicode Canonical Decomposition (NFD)
 * 2. Stripping Latin combining diacritical marks (e.g. ü -> u, é -> e, ñ -> n)
 * 3. Converting to lowercase
 * 4. Collapsing consecutive whitespace
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Escapes characters with special meaning in Regular Expressions.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a Unicode-aware whole-word regex pattern.
 * Uses Unicode property escapes:
 *  - (?<![\p{L}\p{N}]) : Negative lookbehind: preceded by neither a letter nor a number
 *  - (?![\p{L}\p{N}])  : Negative lookahead: followed by neither a letter nor a number
 * 
 * Supports multi-word phrases by replacing internal whitespace with `\s+`.
 */
export function buildKeywordRegex(keyword: string): RegExp {
  const normalized = normalizeText(keyword);
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return /^$/;
  }

  const escapedPattern = words.map(escapeRegex).join("\\s+");
  // Unicode property escapes require the 'u' flag
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapedPattern}(?![\\p{L}\\p{N}])`, "u");
}

/**
 * Determines if a keyword list includes the catch-all wildcard "*"
 */
export function isCatchAll(keywords: string[]): boolean {
  return keywords.some((k) => k.trim() === "*");
}

/**
 * Tests if a comment matches a specific keyword or phrase.
 */
export function matchesKeyword(commentText: string, keyword: string): boolean {
  if (!keyword || !commentText) return false;
  if (keyword.trim() === "*") return true;

  const normalizedComment = normalizeText(commentText);
  const regex = buildKeywordRegex(keyword);
  return regex.test(normalizedComment);
}

/**
 * Tests a comment against a list of trigger keywords.
 * Returns the first matched keyword (normalized), or "*" if catch-all, or null if no match.
 */
export function findMatchingKeyword(
  commentText: string,
  keywords: string[]
): string | null {
  if (!commentText || !keywords || keywords.length === 0) {
    return null;
  }

  // If catch-all wildcard exists
  if (isCatchAll(keywords)) {
    return "*";
  }

  const normalizedComment = normalizeText(commentText);

  for (const keyword of keywords) {
    const trimmed = keyword.trim();
    if (!trimmed) continue;

    const regex = buildKeywordRegex(trimmed);
    if (regex.test(normalizedComment)) {
      return trimmed;
    }
  }

  return null;
}
