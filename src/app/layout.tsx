import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import GlobalToast from "@/components/GlobalToast";
import CompareBar from "@/components/CompareBar";
import { CinematicSiteLoader } from "@/components/CinematicSiteLoader";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/context/AuthContext";
import { constructMetadata } from "@/lib/seo-metadata";
import JsonLd from "@/components/JsonLd";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/json-ld";
import NavigationProgress from "@/components/NavigationProgress";
import GlobalPaymentRecoveryModal from "@/components/checkout/GlobalPaymentRecoveryModal";
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
  title: "GODSMOVE | Modern Apparel & Premium Clothing Online India",
  description:
    "Explore GODSMOVE's modern apparel collection featuring premium T-shirts, oversized tees, hoodies, denim jackets, and distinctive everyday clothing.",
  path: "/",
  keywords: [
    "GODSMOVE",
    "modern apparel India",
    "premium clothing brands India",
    "men's clothing online",
    "oversized t shirts for men",
    "premium t shirts India",
    "hoodies for men",
    "denim jackets for men",
    "contemporary clothing",
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
        <NavigationProgress />
        <JsonLd schema={[getOrganizationSchema(), getWebSiteSchema()]} />
        <GoogleAnalytics />
        <div className="grain-overlay" aria-hidden="true" />
        <AuthProvider>
          {children}
          <GlobalPaymentRecoveryModal />
        </AuthProvider>
        <CinematicSiteLoader />
        <GlobalToast />
        <CompareBar />
      </body>
    </html>
  );
}
