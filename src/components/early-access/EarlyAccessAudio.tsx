'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import styles from './EarlyAccessAudio.module.css';

export default function EarlyAccessAudio() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isSetupRef = useRef(false);

  useEffect(() => {
    // Check saved local preference
    const saved = localStorage.getItem('godsmove_early_access_sound');
    if (saved === 'enabled') {
      setIsEnabled(true);
    }
  }, []);

  // Web Audio Ambient Synthesizer — Solo Violin / Warm Archival Drone
  function startAmbientSynth() {
    if (isSetupRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Frequencies for a warm solo violin A minor chord texture (A3, E4, C5)
      const freqs = [220.0, 329.63, 523.25];

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Sawtooth / Warm violin harmonic blend
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Lowpass filter for smooth, intimate string body tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, ctx.currentTime);

        // Slight LFO vibrato for natural solo violin string feel
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(4.8, ctx.currentTime); // 4.8 Hz vibrato
        lfoGain.gain.setValueAtTime(2.5, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
      });

      // Fade in master gain over 1.5 seconds
      masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);
      isSetupRef.current = true;
      setIsPlaying(true);
    } catch (e) {
      console.error('Ambient audio setup error:', e);
    }
  }

  function stopAmbientSynth() {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        setTimeout(() => {
          ctx.close();
          audioCtxRef.current = null;
          gainNodeRef.current = null;
          isSetupRef.current = false;
          setIsPlaying(false);
        }, 800);
      } catch (e) {
        setIsPlaying(false);
      }
    }
  }

  // Handle visibility change (pause on tab switch)
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      } else if (!document.hidden && audioCtxRef.current && audioCtxRef.current.state === 'suspended' && isEnabled) {
        audioCtxRef.current.resume();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAmbientSynth();
    };
  }, []);

  function toggleSound() {
    if (isEnabled) {
      setIsEnabled(false);
      localStorage.setItem('godsmove_early_access_sound', 'disabled');
      stopAmbientSynth();
    } else {
      setIsEnabled(true);
      localStorage.setItem('godsmove_early_access_sound', 'enabled');
      startAmbientSynth();
    }
  }

  return (
    <button
      type="button"
      className={styles.soundControl}
      onClick={toggleSound}
      title={isEnabled ? 'Mute Background Audio' : 'Enable Background Audio'}
    >
      <span className={styles.indicatorDot} style={{ background: isEnabled ? '#C5A059' : 'rgba(250,248,245,0.3)' }} />
      {isEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
      <span className={styles.label}>{isEnabled ? 'SOUND ON' : 'SOUND'}</span>
    </button>
  );
}
