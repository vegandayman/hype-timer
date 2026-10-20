/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { WorkoutRoutine, AudioSettings, TimerPhase } from '../types/timer';
import { soundEngine } from '../utils/audio';
import { formatTimeDisplay, getContrastTextColor } from '../utils/color';

interface FullscreenTimerProps {
  routine: WorkoutRoutine;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: AudioSettings) => void;
  onExit: () => void;
}

export const FullscreenTimer: React.FC<FullscreenTimerProps> = ({
  routine,
  audioSettings,
  onUpdateAudioSettings,
  onExit,
}) => {
  // Playback state
  const [phase, setPhase] = useState<TimerPhase>(routine.prepDurationSeconds > 0 ? 'prep' : 'active');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    routine.prepDurationSeconds > 0
      ? routine.prepDurationSeconds
      : (routine.segments[0]?.durationSeconds || 10)
  );
  const [totalElapsed, setTotalElapsed] = useState<number>(0);

  // Fullscreen and HUD state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastSecondBeepedRef = useRef<number | null>(null);

  // Active segment data
  const currentSegment = routine.segments[currentSegmentIndex] || routine.segments[0];
  const nextSegment =
    currentSegmentIndex + 1 < routine.segments.length
      ? routine.segments[currentSegmentIndex + 1]
      : currentRound < routine.rounds
      ? routine.segments[0]
      : routine.cooldownSeconds && routine.cooldownSeconds > 0
      ? { id: 'cooldown-preview', name: 'Cool Down', durationSeconds: routine.cooldownSeconds, color: '#0D9488' }
      : null;

  // Maximum duration for progress ring
  const currentDurationLimit =
    phase === 'prep'
      ? routine.prepDurationSeconds
      : phase === 'cooldown'
      ? routine.cooldownSeconds || 30
      : currentSegment?.durationSeconds || 1;

  const progressFraction = Math.max(0, Math.min(1, secondsRemaining / (currentDurationLimit || 1)));

  // Determine current active color
  const activeColor =
    phase === 'prep'
      ? '#F59E0B' // Amber for prep
      : phase === 'cooldown'
      ? '#0D9488' // Teal for cooldown
      : phase === 'completed'
      ? '#10B981' // Emerald for complete
      : currentSegment?.color || '#EF4444';

  const textColor = getContrastTextColor(activeColor);

  // Auto-hide HUD controls after 3 seconds of mouse inactivity
  const triggerActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isRunning && phase !== 'completed') {
        setShowControls(false);
      }
    }, 3200);
  }, [isRunning, phase]);

  // Request screen wake lock so display stays awake during workout
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Wake lock can be denied in certain battery saver modes
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      // Ignore
    }
  }, []);

  // Request full screen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Browser full screen fallback
    }
  }, []);

  // Transition handler
  const advanceToNext = useCallback(() => {
    lastSecondBeepedRef.current = null;

    if (phase === 'prep') {
      // Transition from prep to first interval segment
      setPhase('active');
      setCurrentSegmentIndex(0);
      const firstDuration = routine.segments[0]?.durationSeconds || 10;
      setSecondsRemaining(firstDuration);

      if (audioSettings.soundEnabled) {
        soundEngine.playTransition(audioSettings.soundStyle, audioSettings.volume);
      }
      if (audioSettings.voicePromptEnabled && routine.segments[0]) {
        soundEngine.speak(routine.segments[0].name);
      }
      return;
    }

    if (phase === 'active') {
      const isLastSegmentInRound = currentSegmentIndex >= routine.segments.length - 1;

      if (!isLastSegmentInRound) {
        // Next segment in current round
        const nextIdx = currentSegmentIndex + 1;
        setCurrentSegmentIndex(nextIdx);
        const nextDur = routine.segments[nextIdx]?.durationSeconds || 10;
        setSecondsRemaining(nextDur);

        if (audioSettings.soundEnabled) {
          soundEngine.playTransition(audioSettings.soundStyle, audioSettings.volume);
        }
        if (audioSettings.voicePromptEnabled && routine.segments[nextIdx]) {
          soundEngine.speak(routine.segments[nextIdx].name);
        }
      } else {
        // Last segment in round finished
        if (currentRound < routine.rounds) {
          // Advance to next round
          setCurrentRound((prev) => prev + 1);
          setCurrentSegmentIndex(0);
          const firstDur = routine.segments[0]?.durationSeconds || 10;
          setSecondsRemaining(firstDur);

          if (audioSettings.soundEnabled) {
            soundEngine.playTransition(audioSettings.soundStyle, audioSettings.volume);
          }
          if (audioSettings.voicePromptEnabled && routine.segments[0]) {
            soundEngine.speak(`Round ${currentRound + 1}. ${routine.segments[0].name}`);
          }
        } else {
          // All rounds completed!
          if (routine.cooldownSeconds && routine.cooldownSeconds > 0) {
            setPhase('cooldown');
            setSecondsRemaining(routine.cooldownSeconds);
            if (audioSettings.soundEnabled) {
              soundEngine.playTransition('chime', audioSettings.volume);
            }
            if (audioSettings.voicePromptEnabled) {
              soundEngine.speak('Cool down');
            }
          } else {
            // Workout complete!
            setPhase('completed');
            setIsRunning(false);
            if (audioSettings.soundEnabled) {
              soundEngine.playWorkoutComplete(audioSettings.volume);
            }
            if (audioSettings.voicePromptEnabled) {
              soundEngine.speak('Workout completed! Outstanding job.');
            }
          }
        }
      }
      return;
    }

    if (phase === 'cooldown') {
      setPhase('completed');
      setIsRunning(false);
      if (audioSettings.soundEnabled) {
        soundEngine.playWorkoutComplete(audioSettings.volume);
      }
      if (audioSettings.voicePromptEnabled) {
        soundEngine.speak('Workout completed!');
      }
    }
  }, [phase, currentSegmentIndex, currentRound, routine, audioSettings]);

  // Rewind to previous segment or restart current segment
  const stepBack = useCallback(() => {
    lastSecondBeepedRef.current = null;
    if (phase === 'prep') {
      setSecondsRemaining(routine.prepDurationSeconds);
      return;
    }
    if (phase === 'cooldown') {
      setPhase('active');
      setCurrentSegmentIndex(routine.segments.length - 1);
      setCurrentRound(routine.rounds);
      setSecondsRemaining(routine.segments[routine.segments.length - 1]?.durationSeconds || 10);
      return;
    }
    if (phase === 'completed') {
      setPhase('active');
      setIsRunning(true);
      setCurrentRound(routine.rounds);
      setCurrentSegmentIndex(routine.segments.length - 1);
      setSecondsRemaining(routine.segments[routine.segments.length - 1]?.durationSeconds || 10);
      return;
    }

    // If more than 3 seconds into current segment, restart it
    const segLimit = routine.segments[currentSegmentIndex]?.durationSeconds || 10;
    if (segLimit - secondsRemaining > 3) {
      setSecondsRemaining(segLimit);
      return;
    }

    // Otherwise go to previous segment
    if (currentSegmentIndex > 0) {
      const prevIdx = currentSegmentIndex - 1;
      setCurrentSegmentIndex(prevIdx);
      setSecondsRemaining(routine.segments[prevIdx]?.durationSeconds || 10);
    } else if (currentRound > 1) {
      setCurrentRound((prev) => prev - 1);
      const lastIdx = routine.segments.length - 1;
      setCurrentSegmentIndex(lastIdx);
      setSecondsRemaining(routine.segments[lastIdx]?.durationSeconds || 10);
    } else {
      // At the very beginning
      setSecondsRemaining(routine.segments[0]?.durationSeconds || 10);
    }
  }, [phase, routine, currentSegmentIndex, currentRound, secondsRemaining]);

  // Master timer tick loop
  useEffect(() => {
    if (!isRunning || phase === 'completed') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    requestWakeLock();

    timerRef.current = window.setInterval(() => {
      setTotalElapsed((prev) => prev + 1);

      setSecondsRemaining((prev) => {
        const nextVal = prev - 1;

        // Sound trigger for 3, 2, 1 countdown
        if (
          audioSettings.soundEnabled &&
          nextVal <= audioSettings.countdownSeconds &&
          nextVal >= 1 &&
          lastSecondBeepedRef.current !== nextVal
        ) {
          lastSecondBeepedRef.current = nextVal;
          soundEngine.playCountdownPip(nextVal, audioSettings.volume);
        }

        if (nextVal <= 0) {
          advanceToNext();
          return 0;
        }

        return nextVal;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phase, audioSettings, advanceToNext, requestWakeLock]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [releaseWakeLock]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      triggerActivity();

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        advanceToNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBack();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onUpdateAudioSettings({
          ...audioSettings,
          soundEnabled: !audioSettings.soundEnabled,
        });
      } else if (e.key === 'Escape' && !document.fullscreenElement) {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerActivity, advanceToNext, stepBack, toggleFullscreen, onUpdateAudioSettings, audioSettings, onExit]);

  // Formatted times
  const timeDisplay = formatTimeDisplay(secondsRemaining);
  const totalDisplay = formatTimeDisplay(totalElapsed);

  // Section title and kicker
  const sectionTitle =
    phase === 'prep'
      ? 'GET READY'
      : phase === 'cooldown'
      ? 'COOL DOWN'
      : phase === 'completed'
      ? 'WORKOUT FINISHED!'
      : currentSegment?.name.toUpperCase() || 'INTERVAL';

  const sectionSubtitle =
    phase === 'prep'
      ? `Starting in ${secondsRemaining}s... Round 1 of ${routine.rounds}`
      : phase === 'cooldown'
      ? 'Bring your heart rate down safely'
      : phase === 'completed'
      ? `Total time: ${totalDisplay.formatted} · Completed all ${routine.rounds} rounds`
      : currentSegment?.description || `Round ${currentRound} of ${routine.rounds}`;

  // SVG circular arc progress calculation
  const circleRadius = 140;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - progressFraction * circumference;

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerActivity}
      onClick={(e) => {
        // Toggle play/pause when tapping blank canvas areas
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input')) {
          setIsRunning((prev) => !prev);
          triggerActivity();
        }
      }}
      style={{
        backgroundColor: activeColor,
        color: textColor,
      }}
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col justify-between transition-colors duration-500 ease-out no-select"
    >
      {/* TOP HEADER HUD */}
      <header
        className={`z-20 w-full px-6 py-4 flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } bg-black/20 backdrop-blur-md border-b border-black/10`}
        style={{ color: textColor }}
      >
        {/* Left: Back button & Routine Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/35 transition-colors text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
            title="Exit full-screen timer and return to editor"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="flex items-baseline gap-2">
            <span className="font-athletic text-lg font-bold uppercase tracking-wide truncate max-w-[200px] sm:max-w-xs">
              {routine.name}
            </span>
            <span className="text-xs opacity-75 hidden md:inline">
              · {totalDisplay.formatted} elapsed
            </span>
          </div>
        </div>

        {/* Center: Round / Set Badge */}
        {phase === 'active' && (
          <div className="px-4 py-1 rounded-full font-athletic text-sm md:text-base font-extrabold uppercase tracking-widest bg-black/20 backdrop-blur-md border border-black/10">
            Round {currentRound} / {routine.rounds}
            <span className="opacity-75 font-normal ml-2">
              (Seg {currentSegmentIndex + 1}/{routine.segments.length})
            </span>
          </div>
        )}

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateAudioSettings({
                ...audioSettings,
                soundEnabled: !audioSettings.soundEnabled,
              });
              triggerActivity();
            }}
            className="p-2 rounded-lg bg-black/20 hover:bg-black/35 transition-colors"
            title={audioSettings.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            aria-label="Toggle Sound"
          >
            {audioSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-60" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
              triggerActivity();
            }}
            className="p-2 rounded-lg bg-black/20 hover:bg-black/35 transition-colors"
            title="Toggle Browser Fullscreen (F)"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CENTER STAGE: MASSIVE COUNTDOWN & SECTION TITLE */}
      <main className="z-10 flex-1 flex flex-col items-center justify-center text-center px-4 relative">
        {/* Visual Countdown Warning Flash for last 3 seconds */}
        {secondsRemaining <= 3 && secondsRemaining >= 1 && (
          <div className="absolute inset-0 bg-white/15 animate-ping pointer-events-none rounded-full" />
        )}

        {/* Section Title: Huge, Athletic, Visible from 50ft */}
        <div className="max-w-4xl mx-auto mb-2 md:mb-4">
          <div className="text-xs md:text-sm uppercase tracking-widest font-bold opacity-80 mb-1 flex items-center justify-center gap-2">
            {phase === 'prep' && <Flame className="w-4 h-4 animate-pulse" />}
            {phase === 'active' && <span>Current Interval</span>}
            {phase === 'cooldown' && <span>Recovery Period</span>}
          </div>
          <h1
            className="font-athletic font-black uppercase tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none drop-shadow-md break-words"
            style={{
              color: textColor,
            }}
          >
            {sectionTitle}
          </h1>
          {sectionSubtitle && (
            <p
              className="mt-2 text-sm md:text-lg font-medium opacity-85 max-w-xl mx-auto"
              style={{ color: textColor }}
            >
              {sectionSubtitle}
            </p>
          )}
        </div>

        {/* Giant Timer Display & Circular Ring Container */}
        <div className="relative flex items-center justify-center my-2">
          {/* Subtle Progress Ring (SVG) */}
          <svg className="w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 -rotate-90 transform pointer-events-none">
            {/* Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={circleRadius}
              className="fill-none opacity-20"
              stroke={textColor}
              strokeWidth="12"
            />
            {/* Active Progress Arc */}
            <circle
              cx="50%"
              cy="50%"
              r={circleRadius}
              className="fill-none transition-all duration-300 ease-linear"
              stroke={textColor}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Colossal Digits Centered Inside the Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className={`font-digits font-black tracking-tighter leading-none select-none ${
                secondsRemaining > 99
                  ? 'text-6xl sm:text-7xl md:text-8xl'
                  : 'text-7xl sm:text-8xl md:text-9xl'
              }`}
              style={{
                color: textColor,
              }}
            >
              {timeDisplay.formatted}
            </span>

            {/* Micro Pause Indicator */}
            {!isRunning && phase !== 'completed' && (
              <span className="mt-2 px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-black/40 text-white animate-pulse">
                PAUSED
              </span>
            )}
          </div>
        </div>

        {/* UP NEXT PREVIEW BADGE */}
        {phase !== 'completed' && nextSegment && (
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 text-xs sm:text-sm">
            <span className="opacity-70 font-semibold uppercase tracking-wider">Up Next:</span>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
                style={{ backgroundColor: nextSegment.color }}
              />
              <span className="font-athletic font-bold uppercase tracking-wide text-sm sm:text-base">
                {nextSegment.name}
              </span>
              <span className="opacity-75 font-digits">({nextSegment.durationSeconds}s)</span>
            </div>
          </div>
        )}

        {/* WORKOUT COMPLETED CELEBRATION MODAL */}
        {phase === 'completed' && (
          <div className="mt-4 p-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-athletic text-3xl font-black uppercase tracking-tight text-white mb-1">
              Session Crushed!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              You completed {routine.rounds} rounds of {routine.name}.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Time</span>
                <span className="text-xl font-bold font-digits text-white">{totalDisplay.formatted}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Intervals Done</span>
                <span className="text-xl font-bold font-digits text-white">{routine.rounds * routine.segments.length}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPhase('prep');
                  setCurrentRound(1);
                  setCurrentSegmentIndex(0);
                  setTotalElapsed(0);
                  setSecondsRemaining(routine.prepDurationSeconds > 0 ? routine.prepDurationSeconds : (routine.segments[0]?.durationSeconds || 10));
                  setIsRunning(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-athletic font-bold uppercase text-lg tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-5 h-5" />
                Restart
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExit();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-athletic font-bold uppercase text-lg tracking-wider transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM CONTROL BAR */}
      <footer
        className={`z-20 w-full px-6 py-5 flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } bg-black/20 backdrop-blur-md border-t border-black/10`}
        style={{ color: textColor }}
      >
        {/* Left: Restart Segment */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              stepBack();
              triggerActivity();
            }}
            className="p-3 rounded-xl bg-black/20 hover:bg-black/35 transition-colors text-white"
            title="Previous Segment / Restart (Left Arrow)"
            aria-label="Previous Segment"
          >
            <SkipBack className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Big Play/Pause Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRunning((prev) => !prev);
              triggerActivity();
            }}
            className="px-8 py-3.5 rounded-2xl font-athletic text-xl font-black uppercase tracking-wider flex items-center gap-3 transition-transform active:scale-95 shadow-xl bg-black/35 hover:bg-black/50 text-white"
            title="Spacebar to pause or resume"
          >
            {isRunning ? (
              <>
                <Pause className="w-6 h-6 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Next Segment button */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              advanceToNext();
              triggerActivity();
            }}
            className="p-3 rounded-xl bg-black/20 hover:bg-black/35 transition-colors text-white"
            title="Skip to Next Segment (Right Arrow)"
            aria-label="Next Segment"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Floating Keyboard Shortcuts Hint */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] tracking-wider uppercase opacity-60 pointer-events-none hidden md:block"
        style={{ color: textColor }}
      >
        Space: Pause/Resume · Arrows: Skip · F: Fullscreen · M: Mute
      </div>
    </div>
  );
};
