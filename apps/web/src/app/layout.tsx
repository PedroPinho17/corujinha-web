import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-face",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const defaultTitle = "Corujinha — Centro de Apoio Escolar";
const defaultDescription =
  "Centro de explicações e apoio educativo para crianças até ao 12º ano. Educação com carinho e dedicação em Lobão, São João de Ver e Sanguedo.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s — Corujinha",
  },
  description: defaultDescription,
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: siteUrl,
    siteName: "Corujinha",
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: "/logo.webp", width: 512, height: 230, alt: "Corujinha" }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/logo.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/favicons/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Required for per-request CSP nonces (middleware → Next script injection).
  await connection();
  return (
    <html lang="pt-PT">
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
