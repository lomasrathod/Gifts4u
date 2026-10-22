import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["SOFT", "opsz"] });
const hand = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: "Giftvera: gifts you open together", template: "%s · Giftvera" },
  description:
    "Turn your words and photos into a 3D world you walk through together, or an animated letter with a question at the end. Ready in minutes, sent as a private link.",
  openGraph: { siteName: "Giftvera", type: "website", images: [{ url: "/covers/our-museum.jpg", width: 1200, height: 900 }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#fffaf6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
