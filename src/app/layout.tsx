import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/* Bricolage Grotesque for headline drama & personality */
const heading = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

/* Manrope for crisp display text and UI structure */
const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/* Reserved for data: hashes, API keys, field labels, tabular figures */
const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("relo-theme");if(c!=="light"&&c!=="dark"&&c!=="system")c="light";var d=c==="dark"||(c==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var t=d?"dark":"light";var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t;}catch(_){var e=document.documentElement;e.setAttribute("data-theme","light");e.style.colorScheme="light";}})();`;

/* metadataBase resolves OG/Twitter relative URLs; production injects the real
   origin through NEXT_PUBLIC_APP_URL, previews fall back to the local server. */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "RELO: Comments in. Customers out.",
    template: "%s · RELO",
  },
  description:
    "RELO answers Instagram Reel comments with a public reply and a DM card, through Instagram's official API. Keyword triggers, click tracking, no per-contact pricing.",
  keywords: [
    "RELO",
    "Instagram automation",
    "comment to DM",
    "creator tools",
    "lead capture",
  ],
  openGraph: {
    title: "RELO: Comments in. Customers out.",
    description:
      "Turn Reel comments into DM cards with up to three buttons, through Instagram's official API. No per-contact pricing.",
    siteName: "RELO",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RELO: Comments in. Customers out.",
    description:
      "Turn Reel comments into DM cards with up to three buttons, through Instagram's official API. No per-contact pricing.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#050b18" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * The CSP nonce is minted per request in `src/proxy.ts`. Reading it makes the
   * layout dynamic, which is required for a nonce to be meaningful, and lets
   * the theme script below run under `script-src 'nonce-…'` without relaxing
   * the policy to 'unsafe-inline'.
   */
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    /* suppressHydrationWarning: the script below writes data-theme and
       color-scheme onto <html> before React attaches. That difference is
       intentional, not a bug. */
    <html
      lang="en"
      className={`${display.variable} ${heading.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
