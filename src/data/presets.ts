/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkoutRoutine } from '../types/timer';

export const STARTER_PRESETS: WorkoutRoutine[] = [
  {
    id: 'user-prompt-hiit',
    name: '45s Warm Up / 15s Intense (HIIT)',
    description: 'Directly matching your training routine: warm-up period followed by high intensity burst intervals.',
    category: 'hiit',
    rounds: 4,
    prepDurationSeconds: 5,
    cooldownSeconds: 30,
    segments: [
      {
        id: 'seg-warmup',
        name: 'Warm Up',
        durationSeconds: 45,
        color: '#F59E0B', // Amber
        description: 'Light mobility, jumping jacks, or pulse building',
      },
      {
        id: 'seg-intense',
        name: 'Intense Effort',
        durationSeconds: 15,
        color: '#EF4444', // Flame Red
        description: 'Maximum speed sprint, power burpees, or heavy kettlebell swings',
      },
      {
        id: 'seg-recovery',
        name: 'Active Recovery',
        durationSeconds: 30,
        color: '#10B981', // Emerald Green
        description: 'Deep breathing, hydration, walking pace',
      },
    ],
  },
  {
    id: 'tabata-classic',
    name: 'Tabata 20/10 Protocol',
    description: 'Gold-standard high-intensity interval training. 20s all-out effort, 10s rest, repeated for 8 brutal rounds.',
    category: 'tabata',
    rounds: 8,
    prepDurationSeconds: 5,
    cooldownSeconds: 45,
    segments: [
      {
        id: 'tabata-work',
        name: 'Max Effort Work',
        durationSeconds: 20,
        color: '#DC2626', // Crimson Red
        description: '100% VO2 max output',
      },
      {
        id: 'tabata-rest',
        name: 'Complete Rest',
        durationSeconds: 10,
        color: '#059669', // Dark Mint
        description: 'Breathe and stay loose',
      },
    ],
  },
  {
    id: 'emom-60s',
    name: 'EMOM 60s (Every Minute on Minute)',
    description: 'Complete target reps in 40s, banking remaining 20s as rest before next round begins.',
    category: 'emom',
    rounds: 5,
    prepDurationSeconds: 5,
    cooldownSeconds: 0,
    segments: [
      {
        id: 'emom-work',
        name: 'Station Work Target',
        durationSeconds: 40,
        color: '#2563EB', // Cobalt Blue
        description: 'Complete prescribed reps with strict technique',
      },
      {
        id: 'emom-rest',
        name: 'Transition & Rest',
        durationSeconds: 20,
        color: '#334155', // Charcoal Slate
        description: 'Shake out arms, transition to next exercise',
      },
    ],
  },
  {
    id: 'boxing-rounds',
    name: 'Boxing Ring Rounds (3m / 1m)',
    description: 'Traditional championship sparring format. 3 minutes of heavy bag / pad work with 1 minute corner rest.',
    category: 'boxing',
    rounds: 3,
    prepDurationSeconds: 10,
    cooldownSeconds: 60,
    segments: [
      {
        id: 'boxing-round',
        name: 'Round in Action',
        durationSeconds: 180,
        color: '#EF4444', // Red
        description: 'Combinations, footwork, head movement',
      },
      {
        id: 'boxing-corner',
        name: 'Corner Rest',
        durationSeconds: 60,
        color: '#10B981', // Green
        description: 'Water, towel, deep diaphragmatic breaths',
      },
    ],
  },
  {
    id: 'circuit-full-body',
    name: '5-Stage Full Body Circuit',
    description: 'Continuous progression through muscle groups with color-coded training stages.',
    category: 'circuit',
    rounds: 3,
    prepDurationSeconds: 5,
    cooldownSeconds: 60,
    segments: [
      {
        id: 'circ-push',
        name: 'Upper Body Push',
        durationSeconds: 45,
        color: '#F97316', // Orange
        description: 'Push-ups, dumbbell press, or dips',
      },
      {
        id: 'circ-legs',
        name: 'Lower Body Power',
        durationSeconds: 45,
        color: '#2563EB', // Blue
        description: 'Goblet squats, lunges, or box jumps',
      },
      {
        id: 'circ-cardio',
        name: 'Cardio Spike',
        durationSeconds: 30,
        color: '#EC4899', // Hot Pink
        description: 'High knees, mountain climbers, or battle ropes',
      },
      {
        id: 'circ-core',
        name: 'Core Hold',
        durationSeconds: 30,
        color: '#8B5CF6', // Purple
        description: 'Plank or hollow body hold',
      },
      {
        id: 'circ-rest',
        name: 'Set Transition Rest',
        durationSeconds: 30,
        color: '#059669', // Emerald
        description: 'Breathe and hydrate before next round',
      },
    ],
  },
];
