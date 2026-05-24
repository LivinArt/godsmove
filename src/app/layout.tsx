import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import GlobalToast from "@/components/GlobalToast";
import { CinematicSiteLoader } from "@/components/CinematicSiteLoader";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GODSMOVE — Make Your Move.",
  description:
    "Worn With Intent. GODSMOVE is built for people who move with purpose — decisive creators who execute at the highest level.",
  keywords: ["streetwear", "fashion", "India", "oversized", "drop shoulder", "editorial", "culture", "godsmove"],
  openGraph: {
    title: "GODSMOVE — Make Your Move.",
    description: "Worn With Intent.",
    type: "website",
    locale: "en_IN",
    siteName: "GODSMOVE",
  },
  twitter: {
    card: "summary_large_image",
    title: "GODSMOVE",
    description: "Worn With Intent.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <div className="grain-overlay" aria-hidden="true" />
        {children}
        <CinematicSiteLoader />
        <GlobalToast />
      </body>
    </html>
  );
}
