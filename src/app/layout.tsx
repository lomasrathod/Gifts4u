import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Giftvera: gifts you open together", template: "%s · Giftvera" },
  description:
    "Turn your words and photos into a 3D world you walk through together, or an animated letter with a question at the end. Ready in minutes, sent as a private link.",
  openGraph: { siteName: "Giftvera", type: "website" },
};

export const viewport: Viewport = { themeColor: "#fffaf6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
