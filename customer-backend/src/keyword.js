// Keyword matching for automation triggers.
// Concept adapted from OpenReply (MIT, © 2026 Anish Raj / Diwen Huang):
// Unicode-aware whole-word match, emoji/symbol stripping, Latin-only
// diacritic folding (marks in other scripts are load-bearing and preserved).

export function stripSpecialCharacters(text) {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function foldDiacritics(text) {
  let out = "";
  let baseIsLatin = false;
  for (const char of text.normalize("NFD")) {
    if (/\p{M}/u.test(char)) {
      if (!baseIsLatin) out += char;
      continue;
    }
    baseIsLatin = /\p{Script=Latin}/u.test(char);
    out += char;
  }
  return out.normalize("NFC");
}

function normalize(text) {
  return foldDiacritics(stripSpecialCharacters(text)).toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * OR-match text against keywords.
 * @returns {{ matched: boolean, matchedKeyword: string|null }}
 */
export function matchKeywords(text, keywords, wholeWordMatch = true) {
  if (!text || !Array.isArray(keywords) || keywords.length === 0) {
    return { matched: false, matchedKeyword: null };
  }
  const cleaned = normalize(text);
  if (!cleaned) return { matched: false, matchedKeyword: null };

  for (const keyword of keywords) {
    const cleanedKeyword = normalize(keyword);
    if (!cleanedKeyword) continue;
    if (wholeWordMatch) {
      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}])${escapeRegExp(cleanedKeyword)}(?![\\p{L}\\p{N}])`,
        "iu"
      );
      if (regex.test(cleaned)) return { matched: true, matchedKeyword: keyword };
    } else if (cleaned.includes(cleanedKeyword)) {
      return { matched: true, matchedKeyword: keyword };
    }
  }
  return { matched: false, matchedKeyword: null };
}

/** Replace {username} (case-insensitive) with the commenter's name. */
export function personalize(template, username) {
  return template.replace(/\{username\}/gi, username || "there");
}
