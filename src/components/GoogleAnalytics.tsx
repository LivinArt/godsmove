'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface GoogleAnalyticsProps {
  gaId?: string;
}

function RouteTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    window.gtag('config', gaId, {
      page_path: url,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const measurementId = gaId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Inject only in production or when explicit ID is configured
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldInject = measurementId && (isProduction || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

  if (!shouldInject || !measurementId) {
    return null;
  }

  return (
    <>
      {/* gtag.js loader */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />

      {/* Initialization script */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />

      {/* SPA Route change tracker wrapped in Suspense for App Router */}
      <Suspense fallback={null}>
        <RouteTracker gaId={measurementId} />
      </Suspense>
    </>
  );
}
