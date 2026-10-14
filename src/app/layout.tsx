import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const bricolage = Bricolage_Grotesque({
  variable: "--font-sans-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-sans-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/* the italic voice — serif accents that read like a whisper from another world */
const instrument = Instrument_Serif({
  variable: "--font-serif-accent",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RELO — Comments in. Customers out.",
  description:
    "RELO turns Instagram Reel comments into verified, 3-button DMs on complete autopilot — with anti-spam human timing built in. Set it once, sell forever.",
  keywords: ["RELO", "Instagram automation", "comment to DM", "creator tools", "lead capture"],
  openGraph: {
    title: "RELO — Comments in. Customers out.",
    description:
      "Turn Reel comments into verified, 3-button DMs on autopilot. Human timing. Zero contact tax.",
    siteName: "RELO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0b16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable} ${spaceMono.variable} ${instrument.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
