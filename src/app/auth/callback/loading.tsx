'use client';

import { LuxuryAuthLoader } from '@/components/LuxuryAuthLoader';

export default function AuthCallbackLoading() {
  return (
    <LuxuryAuthLoader
      isVisible={true}
      title="Completing Authentication..."
      subtitle="Finalizing secure session"
    />
  );
}
