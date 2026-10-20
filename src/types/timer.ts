/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SoundEffectType = 'beeps' | 'boxing_bell' | 'whistle' | 'chime';

export interface IntervalSegment {
  id: string;
  name: string;             // e.g., "Warm Up", "High Intensity Sprint", "Active Rest"
  durationSeconds: number;  // Duration in seconds (e.g., 45)
  color: string;            // Hex color code (e.g., "#ef4444")
  description?: string;     // Optional exercise description (e.g., "Kettlebell swings")
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  category: 'hiit' | 'tabata' | 'emom' | 'boxing' | 'circuit' | 'custom' | 'presentation';
  rounds: number;              // Number of times the sequence repeats
  prepDurationSeconds: number; // Initial countdown before workout starts (default 5s)
  cooldownSeconds?: number;    // Optional cooldown at the very end
  segments: IntervalSegment[];
  isCustom?: boolean;
}

export type TimerPhase = 'idle' | 'prep' | 'active' | 'cooldown' | 'completed';

export interface PlaybackState {
  phase: TimerPhase;
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;        // 1-indexed
  currentSegmentIndex: number; // 0-indexed
  timeRemainingInSegment: number; // Seconds remaining in active segment/prep/cooldown
  totalElapsedSeconds: number;
}

export interface AudioSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 1
  soundStyle: SoundEffectType;
  voicePromptEnabled: boolean; // Announces segment name via speech synthesis
  countdownSeconds: number; // Seconds before transition to start beeping (default 3)
}
