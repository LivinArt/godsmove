'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function HomepageGreeting() {
  const { profile, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (loading || !profile || !profile.firstName) return;

    // Check if greeting already shown in this session
    const greetingShown = sessionStorage.getItem('godsmove_greeting_shown');
    if (!greetingShown) {
      const greetings = [
        `Welcome back, ${profile.firstName}.`,
        `Good to see you again, ${profile.firstName}.`,
        'Nice to have you here.'
      ];
      // Deterministically pick one based on name length to avoid flash changes
      const index = profile.firstName.length % greetings.length;
      const selected = greetings[index];
      
      setGreeting(selected);
      setVisible(true);
      sessionStorage.setItem('godsmove_greeting_shown', 'true');

      const timer = setTimeout(() => {
        setVisible(false);
      }, 4500); // Fade away after 4.5 seconds

      return () => clearTimeout(timer);
    }
  }, [profile, loading]);

  if (!visible || !greeting) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '100px', // Place below navbar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        pointerEvents: 'none',
        animation: 'fadeInOut 4.5s ease-in-out forwards',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -8px); filter: blur(4px); }
          12% { opacity: 1; transform: translate(-50%, 0); filter: blur(0); }
          88% { opacity: 1; transform: translate(-50%, 0); filter: blur(0); }
          100% { opacity: 0; transform: translate(-50%, -8px); filter: blur(4px); }
        }
      `}} />
      <span 
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: '12px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          padding: '8px 20px',
          borderRadius: '30px',
          border: '1px solid rgba(10, 10, 10, 0.06)',
          boxShadow: '0 4px 16px rgba(10, 10, 10, 0.04)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {greeting}
      </span>
    </div>
  );
}
