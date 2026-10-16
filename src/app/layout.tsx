import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/* One grotesque for the whole product, from 11px instrument labels to the
   64px hero. Weight and tracking do the hierarchy work, not extra families. */
const display = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/* Reserved for data: counters, tabular figures, field labels, keys. */
const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("relo-theme")||"system";var d=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var t=d?"dark":"light";var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t;}catch(_){}})();`;

export const metadata: Metadata = {
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
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#100e0c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* suppressHydrationWarning: the script below writes data-theme and
       color-scheme onto <html> before React attaches. That difference is
       intentional, not a bug. */
    <html
      lang="en"
      className={`${display.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
