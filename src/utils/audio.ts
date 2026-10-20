/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundEffectType } from '../types/timer';

class AudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Resumes AudioContext on initial user gesture
   */
  public init() {
    this.getContext();
  }

  /**
   * Play short crisp countdown pip for seconds 3, 2, 1
   */
  public playCountdownPip(secondsLeft: number, volume = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Slightly higher pitch as we approach 1
      const freq = secondsLeft === 1 ? 987.77 : secondsLeft === 2 ? 880 : 784;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(Math.min(1, volume * 0.9), now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Play transition sound when interval switches
   */
  public playTransition(style: SoundEffectType, volume = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (style === 'boxing_bell') {
        // Multi-frequency brass ring bell
        const freqs = [587.33, 880, 1174.66, 1760];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const decayTime = 1.2 - idx * 0.2;
          const initialVol = (volume * 0.8) / (idx + 1);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(initialVol, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + decayTime + 0.05);
        });
      } else if (style === 'whistle') {
        // Coach whistle with rapid frequency oscillation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.linearRampToValueAtTime(2800, now + 0.08);
        osc.frequency.linearRampToValueAtTime(2500, now + 0.25);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.02);
        gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      } else if (style === 'chime') {
        // Zen harmonic transition chime
        const baseFreq = 528; // Solfeggio clarity frequency
        [baseFreq, baseFreq * 1.5, baseFreq * 2].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const dur = 1.8 - i * 0.3;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime((volume * 0.7) / (i + 1), now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + dur + 0.05);
        });
      } else {
        // Standard high-energy gym transition buzzer/double beep
        const playBeep = (timeOffset: number, pitch: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(pitch, now + timeOffset);

          gain.gain.setValueAtTime(0.001, now + timeOffset);
          gain.gain.linearRampToValueAtTime(volume * 0.85, now + timeOffset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + 0.24);
        };

        playBeep(0, 1174.66); // High D
        playBeep(0.18, 1480); // High F#
      }
    } catch {
      // Audio error safety
    }
  }

  /**
   * Play completion celebratory fanfare
   */
  public playWorkoutComplete(volume = 0.85) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 523.25, time: 0, dur: 0.2 },     // C5
        { freq: 659.25, time: 0.18, dur: 0.2 },  // E5
        { freq: 783.99, time: 0.36, dur: 0.25 }, // G5
        { freq: 1046.50, time: 0.58, dur: 0.8 }, // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.05);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Speak segment name using browser SpeechSynthesis
   */
  public speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error safety
    }
  }
}

export const soundEngine = new AudioEngine();
