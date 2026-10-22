import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Schibsted_Grotesk, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/* One grotesque for the whole product, from 11px instrument labels to the
   64px hero. Weight and tracking do the hierarchy work, not extra families. */
const display = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/* A single editorial italic, used only for one phrase per screen. It gives the
   marketing and page titles a human cadence without turning the UI into a
   magazine. */
const editorial = Instrument_Serif({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

/* Reserved for data: counters, tabular figures, field labels, keys. */
const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("relo-theme");if(c!=="light"&&c!=="dark"&&c!=="system")c="dark";var d=c==="dark"||(c==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var t=d?"dark":"light";var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t;}catch(_){var e=document.documentElement;e.setAttribute("data-theme","dark");e.style.colorScheme="dark";}})();`;

/* metadataBase resolves OG/Twitter relative URLs; production injects the real
   origin through NEXT_PUBLIC_APP_URL, previews fall back to the local server. */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "RELO: Comments in. Customers out.",
    template: "%s · RELO",
  },
  description:
    "RELO turns Instagram Reel comments into verified, three-button DMs through Instagram's official API. Set it once, sell forever.",
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
      "Turn Reel comments into verified, three-button DMs through Instagram's official API. No per-contact pricing.",
    siteName: "RELO",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RELO: Comments in. Customers out.",
    description:
      "Turn Reel comments into verified, three-button DMs through Instagram's official API. No per-contact pricing.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
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
      className={`${display.variable} ${editorial.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
