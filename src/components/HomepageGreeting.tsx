'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

interface HomepageGreetingProps {
  profile: any;
  walletBalance: number;
  hasRecentlyDelivered: boolean;
  hasApprovedReturn: boolean;
  hasActiveCare: boolean;
}

export default function HomepageGreeting({
  profile,
  walletBalance,
  hasRecentlyDelivered,
  hasApprovedReturn,
  hasActiveCare
}: HomepageGreetingProps) {
  const cart = useStore((s) => s.cart);
  const [greeting, setGreeting] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 1. Return Approved
    if (hasApprovedReturn) {
      setGreeting('Your credits have been restored.');
      return;
    }

    // 3. Wallet Credits Available
    if (walletBalance > 0) {
      setGreeting('Your archive credits are ready.');
      return;
    }

    // 4. Order Recently Delivered
    if (hasRecentlyDelivered) {
      setGreeting('Your latest archive has arrived.');
      return;
    }

    // 5. Cart contains products
    if (cart && cart.length > 0) {
      const greetings = [
        'Your archive awaits.',
        'Your selection is almost complete.',
        'Your collection deserves a home.'
      ];
      setGreeting(greetings[cart.length % greetings.length]);
      return;
    }

    // 6. Returning User Interval
    const lastVisit = localStorage.getItem('gm_last_visit');
    const now = Date.now();
    localStorage.setItem('gm_last_visit', now.toString());

    if (profile && profile.firstName) {
      if (!lastVisit) {
        setGreeting(`Welcome, ${profile.firstName}.`);
      } else {
        const daysDiff = (now - Number(lastVisit)) / (24 * 60 * 60 * 1000);
        if (daysDiff > 3) {
          setGreeting('Good to see you again.');
        } else {
          setGreeting('Welcome Back.');
        }
      }
    } else {
      setGreeting('Welcome.');
    }
  }, [mounted, profile, walletBalance, hasRecentlyDelivered, hasApprovedReturn, hasActiveCare, cart]);

  if (!mounted || !greeting) return null;

  return (
    <div 
      className="container" 
      style={{ 
        marginTop: 'var(--space-2xl)', 
        marginBottom: 'calc(-1 * var(--space-xl))',
        opacity: 0,
        animation: 'fadeInText 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInText {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
      <span 
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 500,
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#c8a46a',
          display: 'block'
        }}
      >
        {greeting}
      </span>
    </div>
  );
}
