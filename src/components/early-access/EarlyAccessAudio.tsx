'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import styles from './EarlyAccessAudio.module.css';

const AUDIO_SRC = '/audio/early-access.mp3';
const TARGET_VOLUME = 0.15;

export default function EarlyAccessAudio() {
  // Default to ON unless explicitly saved as 'disabled'
  const [isEnabled, setIsEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeAnimRef = useRef<number | null>(null);

  // Initialize preference on client mount
  useEffect(() => {
    const saved = localStorage.getItem('godsmove_early_access_sound');
    if (saved === 'disabled') {
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
    }
  }, []);

  // Smooth Volume Ramping Helper
  const rampVolume = useCallback((targetVol: number, durationMs: number, onComplete?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeAnimRef.current) {
      cancelAnimationFrame(fadeAnimRef.current);
      fadeAnimRef.current = null;
    }

    const startVol = audio.volume;
    const startTime = performance.now();

    function step(now: number) {
      if (!audio) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      
      // Linear volume interpolation
      const current = startVol + (targetVol - startVol) * progress;
      audio.volume = Math.max(0, Math.min(1, current));

      if (progress < 1) {
        fadeAnimRef.current = requestAnimationFrame(step);
      } else {
        fadeAnimRef.current = null;
        if (onComplete) onComplete();
      }
    }

    fadeAnimRef.current = requestAnimationFrame(step);
  }, []);

  // Initialize HTML5 Audio instance
  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      if (fadeAnimRef.current) cancelAnimationFrame(fadeAnimRef.current);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  // Start Playback with 1000ms Fade-In
  const playWithFade = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          rampVolume(TARGET_VOLUME, 1000);
        })
        .catch((err) => {
          // Autoplay blocked by browser policy until user interaction
          setIsPlaying(false);
        });
    }
  }, [rampVolume]);

  // Pause Playback with 500ms Fade-Out
  const pauseWithFade = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    rampVolume(0, 500, () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });
  }, [rampVolume]);

  // Handle Play/Pause transitions when state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isEnabled) {
      playWithFade();
    } else {
      pauseWithFade();
    }
  }, [isEnabled, playWithFade, pauseWithFade]);

  // Global first-user-interaction listener to unlock audio if blocked by browser policy
  useEffect(() => {
    function handleFirstInteraction() {
      if (isEnabled && audioRef.current && audioRef.current.paused) {
        playWithFade();
      }
    }

    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('gm_user_interaction', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('gm_user_interaction', handleFirstInteraction);
    };
  }, [isEnabled, playWithFade]);

  // Handle Tab Visibility (pause when tab hidden)
  useEffect(() => {
    function handleVisibility() {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (isPlaying) {
          audio.pause();
        }
      } else if (!document.hidden && isEnabled) {
        playWithFade();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isEnabled, isPlaying, playWithFade]);

  function toggleSound(e: React.MouseEvent) {
    e.stopPropagation();
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
      aria-label={isEnabled && isPlaying ? 'Mute background music' : 'Enable background music'}
      title={isEnabled && isPlaying ? 'Mute background music' : 'Enable background music'}
    >
      {isEnabled && isPlaying ? (
        <Volume2 size={18} className={styles.iconActive} />
      ) : (
        <VolumeX size={18} className={styles.iconMuted} />
      )}
    </button>
  );
}
