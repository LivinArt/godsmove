'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import styles from './EarlyAccessAudio.module.css';

export default function EarlyAccessAudio() {
  const [isEnabled, setIsEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check saved local preference
    const saved = localStorage.getItem('godsmove_early_access_sound');
    if (saved === 'enabled') {
      setIsEnabled(true);
    }
  }, []);

  useEffect(() => {
    // Initialize HTML5 Audio instance with low-volume ambient audio
    const audio = new Audio('/audio/early-access-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  // Handle Play / Pause based on state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay blocked by browser policy until user click
          console.log('Audio playback waiting for user interaction:', err.message);
        });
      }
    } else {
      audio.pause();
    }
  }, [isEnabled]);

  // Handle Visibility Change (pause when tab hidden)
  useEffect(() => {
    function handleVisibility() {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        audio.pause();
      } else if (!document.hidden && isEnabled) {
        audio.play().catch(() => {});
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isEnabled]);

  function toggleSound() {
    if (isEnabled) {
      setIsEnabled(false);
      localStorage.setItem('godsmove_early_access_sound', 'disabled');
    } else {
      setIsEnabled(true);
      localStorage.setItem('godsmove_early_access_sound', 'enabled');
    }
  }

  return (
    <button
      type="button"
      className={styles.soundIconButton}
      onClick={toggleSound}
      aria-label={isEnabled ? 'Mute sound' : 'Enable sound'}
      title={isEnabled ? 'Mute sound' : 'Enable sound'}
    >
      {isEnabled ? (
        <Volume2 size={16} className={styles.iconActive} />
      ) : (
        <VolumeX size={16} className={styles.iconMuted} />
      )}
    </button>
  );
}
