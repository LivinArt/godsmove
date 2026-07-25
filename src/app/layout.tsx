import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import GlobalToast from "@/components/GlobalToast";
import CompareBar from "@/components/CompareBar";
import { CinematicSiteLoader } from "@/components/CinematicSiteLoader";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/context/AuthContext";
import { constructMetadata } from "@/lib/seo-metadata";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = constructMetadata({
  title: "GODSMOVE — Make Your Move | Luxury Streetwear",
  description:
    "Worn With Intent. GODSMOVE is engineered for decisive creators — architectural silhouettes, heavy 240+ GSM drop-shoulder tees, and limited archival allocations.",
  path: "/",
  keywords: [
    "GODSMOVE",
    "luxury streetwear India",
    "oversized t-shirts India",
    "drop shoulder heavy t-shirt",
    "architectural apparel",
    "decisive creators streetwear",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <GoogleAnalytics />
        <div className="grain-overlay" aria-hidden="true" />
        <AuthProvider>
          {children}
        </AuthProvider>
        <CinematicSiteLoader />
        <GlobalToast />
        <CompareBar />
      </body>
    </html>
  );
}
