import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Limit parallel static generation to avoid Supabase session pool exhaustion during `next build`
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 50,
  },
  images: {
    contentDispositionType: 'inline',
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ocecnmljilczoipxfnlb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'fxgbkmuqlizeosvidezm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/drops',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
