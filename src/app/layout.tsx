import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GODSMOVE — Make Your Move.",
  description: "Doomed to Drip. GODSMOVE is built for people who move with purpose — decisive creators who execute at the highest level.",
  keywords: ["streetwear", "fashion", "India", "oversized", "drop shoulder", "editorial", "culture", "godsmove"],
  openGraph: {
    title: "GODSMOVE — Make Your Move.",
    description: "Doomed to Drip.",
    type: "website",
    locale: "en_IN",
    siteName: "GODSMOVE",
  },
  twitter: {
    card: "summary_large_image",
    title: "GODSMOVE",
    description: "Doomed to Drip.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
