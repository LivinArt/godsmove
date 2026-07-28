'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        try {
          const url = new URL(anchor.href);
          if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
            setLoading(true);
          }
        } catch {}
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true });
  }, []);

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 99999,
        background: 'linear-gradient(90deg, #c8a46a, #e2c28d, #c8a46a)',
        backgroundSize: '200% 100%',
        animation: 'topBarProgress 1.2s infinite linear, topBarGlow 0.8s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes topBarProgress {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes topBarGlow {
          0% { box-shadow: 0 0 4px #c8a46a; }
          100% { box-shadow: 0 0 12px #c8a46a; }
        }
      `}</style>
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}
