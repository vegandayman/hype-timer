/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkoutRoutine, AudioSettings } from './types/timer';
import { STARTER_PRESETS } from './data/presets';
import { FullscreenTimer } from './components/FullscreenTimer';
import { RoutineBuilder } from './components/RoutineBuilder';
import { soundEngine } from './utils/audio';

const STORAGE_KEY_SAVED_ROUTINES = 'pulseinterval_saved_routines_v1';
const STORAGE_KEY_ACTIVE_ROUTINE = 'pulseinterval_active_routine_v1';
const STORAGE_KEY_AUDIO = 'pulseinterval_audio_settings_v1';

export default function App() {
  // Always enforce dark theme class on document body/root
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Load saved routines from localStorage or fallback to starter templates
  const [savedRoutines, setSavedRoutines] = useState<WorkoutRoutine[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_ROUTINES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Active workout routine
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ROUTINE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return STARTER_PRESETS[0];
  });

  // Audio settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUDIO);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return {
      soundEnabled: true,
      volume: 0.85,
      soundStyle: 'beeps',
      voicePromptEnabled: false,
      countdownSeconds: 3,
    };
  });

  // Mode: builder vs fullscreen training
  const [isTrainingActive, setIsTrainingActive] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_ROUTINES, JSON.stringify(savedRoutines));
    } catch {
      // Ignore storage errors
    }
  }, [savedRoutines]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ROUTINE, JSON.stringify(activeRoutine));
    } catch {
      // Ignore
    }
  }, [activeRoutine]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify(audioSettings));
    } catch {
      // Ignore
    }
  }, [audioSettings]);

  // Handlers
  const handleStartWorkout = async () => {
    soundEngine.init();
    setIsTrainingActive(true);

    // Attempt browser fullscreen request
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen policy may require user interaction
    }
  };

  const handleExitWorkout = async () => {
    setIsTrainingActive(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveRoutine = (routineToSave: WorkoutRoutine) => {
    const existingIdx = savedRoutines.findIndex((r) => r.id === routineToSave.id);
    if (existingIdx !== -1) {
      const updated = [...savedRoutines];
      updated[existingIdx] = routineToSave;
      setSavedRoutines(updated);
    } else {
      setSavedRoutines([
        ...savedRoutines,
        {
          ...routineToSave,
          id: `custom-${Date.now()}`,
          isCustom: true,
        },
      ]);
    }
  };

  const handleDeleteSavedRoutine = (id: string) => {
    setSavedRoutines(savedRoutines.filter((r) => r.id !== id));
  };

  const handleSelectSavedOrPreset = (r: WorkoutRoutine) => {
    setActiveRoutine({
      ...r,
      id: r.isCustom ? r.id : `routine-${Date.now()}`,
    });
  };

  return (
    <div className="w-full min-h-screen dark bg-slate-950 text-white">
      {isTrainingActive ? (
        <FullscreenTimer
          routine={activeRoutine}
          audioSettings={audioSettings}
          onUpdateAudioSettings={setAudioSettings}
          onExit={handleExitWorkout}
        />
      ) : (
        <RoutineBuilder
          routine={activeRoutine}
          onChangeRoutine={setActiveRoutine}
          onStartWorkout={handleStartWorkout}
          audioSettings={audioSettings}
          onUpdateAudioSettings={setAudioSettings}
          savedRoutines={savedRoutines}
          onSaveRoutine={handleSaveRoutine}
          onDeleteSavedRoutine={handleDeleteSavedRoutine}
          onSelectSavedOrPreset={handleSelectSavedOrPreset}
        />
      )}
    </div>
  );
}
