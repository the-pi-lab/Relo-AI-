import type { LinkPage, LinkBlock } from "../db/linkPage";

/**
 * Server-rendered public link-in-bio page (plan.md §4.5 / Phase 2).
 *
 * Rendered on the Worker rather than in the SPA so the page a creator drops
 * into their Instagram bio is one request, fully cacheable, and independent of
 * the dashboard bundle. All styling is inline — no external CSS, no fonts to
 * block first paint on a phone.
 *
 * Clicks go through /l/:id so they land in the same Sent → Clicked funnel the
 * DM buttons already feed.
 */

const THEMES: Record<string, { bg: string; card: string; text: string; muted: string; ring: string }> = {
  volt: { bg: "#f7f8fa", card: "#ffffff", text: "#0f1115", muted: "#4b5563", ring: "#c9f94e" },
  plain: { bg: "#ffffff", card: "#f7f8fa", text: "#0f1115", muted: "#8a919e", ring: "#e7e9ee" },
  dark: { bg: "#0b0d12", card: "#12151c", text: "#e6e8ef", muted: "#9aa3b2", ring: "#c9f94e" },
};

/** Escapes text for interpolation into HTML. Creator copy is untrusted. */
function esc(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only http(s) survives. A creator pasting javascript: into a link that gets
 * shared publicly is exactly the case this blocks.
 */
function safeUrl(raw: string): string {
  const url = String(raw || "").trim();
  if (!/^https?:\/\//i.test(url)) return "";
  return esc(url);
}

export function renderLinkPageHtml(
  page: LinkPage & { blocks: LinkBlock[]; username: string },
  origin: string
): string {
  const theme = THEMES[page.theme] ?? THEMES.volt;
  const title = page.headline?.trim() || `@${page.username}`;
  const description = page.bio?.trim() || `Links from @${page.username}`;

  const links = page.blocks
    .map((block) => {
      const href = block.shortLinkId
        ? `${origin}/l/${block.shortLinkId}`
        : safeUrl(block.targetUrl);
      if (!href) return "";
      return `<a class="btn" href="${href}" rel="noopener nofollow">${esc(block.label)}</a>`;
    })
    .filter(Boolean)
    .join("\n      ");

  // JSON-LD keeps the page legible to the crawlers plan.md's SEO work allows.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: `@${page.username}`,
      description,
    },
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="profile">
<link rel="canonical" href="${origin}/p/${esc(page.id)}">
<script type="application/ld+json">${JSON.stringify(structuredData)}</script>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px calc(40px + env(safe-area-inset-bottom));
    background: ${theme.bg};
    color: ${theme.text};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main { width: 100%; max-width: 420px; }
  .handle {
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${theme.muted};
    margin: 0 0 10px;
  }
  h1 {
    text-align: center;
    font-size: 26px;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin: 0 0 10px;
  }
  .bio {
    text-align: center;
    font-size: 15px;
    line-height: 1.6;
    color: ${theme.muted};
    margin: 0 0 28px;
    white-space: pre-line;
  }
  .links { display: flex; flex-direction: column; gap: 12px; }
  .btn {
    display: block;
    padding: 16px 20px;
    border-radius: 14px;
    background: ${theme.card};
    border: 1px solid ${theme.ring};
    color: ${theme.text};
    font-size: 15px;
    font-weight: 650;
    text-align: center;
    text-decoration: none;
    transition: transform 150ms cubic-bezier(0.16,1,0.3,1), box-shadow 150ms cubic-bezier(0.16,1,0.3,1);
  }
  .btn:active { transform: scale(0.98); }
  .btn:focus-visible { outline: 2px solid ${theme.ring}; outline-offset: 3px; }
  footer {
    margin-top: 32px;
    text-align: center;
    font-size: 12px;
    color: ${theme.muted};
  }
  footer a { color: inherit; text-decoration: none; border-bottom: 1px solid ${theme.ring}; }
  @media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
</style>
</head>
<body>
<main>
  <p class="handle">@${esc(page.username)}</p>
  <h1>${esc(page.headline?.trim() || "Links")}</h1>
  ${page.bio ? `<p class="bio">${esc(page.bio)}</p>` : ""}
  <div class="links">
      ${links || `<a class="btn" href="https://instagram.com/${esc(page.username)}" rel="noopener">Follow on Instagram</a>`}
  </div>
  <footer>Made with <a href="https://relo.ai" rel="noopener">RELO</a></footer>
</main>
</body>
</html>`;
}
