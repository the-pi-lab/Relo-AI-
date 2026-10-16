import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/* One distinctive sans family for everything — no Inter, no serif accents. */
const sans = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RELO — Comments in. Customers out.",
  description:
    "RELO turns Instagram Reel comments into verified, 3-button DMs through Instagram's official API. Set it once, sell forever.",
  keywords: ["RELO", "Instagram automation", "comment to DM", "creator tools", "lead capture"],
  openGraph: {
    title: "RELO — Comments in. Customers out.",
    description:
      "Turn Reel comments into verified, 3-button DMs through Instagram's official API. No per-contact pricing.",
    siteName: "RELO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
