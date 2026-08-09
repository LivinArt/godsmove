'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.05,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already visible, skip observer
    if (el.classList.contains('visible')) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              const timer = setTimeout(() => {
                if (el) el.classList.add('visible');
              }, delay);
              observer.unobserve(el);
              return () => clearTimeout(timer);
            } else {
              el.classList.add('visible');
              observer.unobserve(el);
            }
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px 80px 0px', // Trigger 80px before entering viewport for seamless scroll
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
