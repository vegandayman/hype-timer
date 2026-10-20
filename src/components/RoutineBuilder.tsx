/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles,
  Bookmark,
  Check,
  Flame,
} from 'lucide-react';
import { WorkoutRoutine, IntervalSegment, AudioSettings, SoundEffectType } from '../types/timer';
import { ATHLETIC_COLOR_PRESETS, getContrastTextColor, formatTimeDisplay } from '../utils/color';
import { soundEngine } from '../utils/audio';
import { STARTER_PRESETS } from '../data/presets';

interface RoutineBuilderProps {
  routine: WorkoutRoutine;
  onChangeRoutine: (updated: WorkoutRoutine) => void;
  onStartWorkout: () => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: AudioSettings) => void;
  savedRoutines: WorkoutRoutine[];
  onSaveRoutine: (routine: WorkoutRoutine) => void;
  onDeleteSavedRoutine: (id: string) => void;
  onSelectSavedOrPreset: (r: WorkoutRoutine) => void;
}

export const RoutineBuilder: React.FC<RoutineBuilderProps> = ({
  routine,
  onChangeRoutine,
  onStartWorkout,
  audioSettings,
  onUpdateAudioSettings,
  savedRoutines,
  onSaveRoutine,
  onDeleteSavedRoutine,
  onSelectSavedOrPreset,
}) => {
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'presets' | 'saved'>('editor');
  const [editingColorForId, setEditingColorForId] = useState<string | null>(null);

  // Calculate total workout duration
  const singleRoundDuration = routine.segments.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalWorkoutSeconds =
    routine.prepDurationSeconds +
    singleRoundDuration * routine.rounds +
    (routine.cooldownSeconds || 0);

  const formattedTotal = formatTimeDisplay(totalWorkoutSeconds);

  // Segment operations
  const handleAddSegment = () => {
    const newId = `seg-${Date.now()}`;
    const defaultColor =
      routine.segments.length % 2 === 0
        ? '#EF4444' // Work (Red)
        : '#10B981'; // Rest (Green)

    const newSegment: IntervalSegment = {
      id: newId,
      name: routine.segments.length % 2 === 0 ? 'Intense Effort' : 'Active Rest',
      durationSeconds: routine.segments.length % 2 === 0 ? 30 : 15,
      color: defaultColor,
    };

    onChangeRoutine({
      ...routine,
      segments: [...routine.segments, newSegment],
    });
  };

  const handleUpdateSegment = (id: string, updates: Partial<IntervalSegment>) => {
    onChangeRoutine({
      ...routine,
      segments: routine.segments.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleDeleteSegment = (id: string) => {
    if (routine.segments.length <= 1) return; // Keep at least one segment
    onChangeRoutine({
      ...routine,
      segments: routine.segments.filter((s) => s.id !== id),
    });
  };

  const handleDuplicateSegment = (id: string) => {
    const idx = routine.segments.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const source = routine.segments[idx];
    const clone: IntervalSegment = {
      ...source,
      id: `seg-${Date.now()}`,
      name: `${source.name}`,
    };
    const updated = [...routine.segments];
    updated.splice(idx + 1, 0, clone);
    onChangeRoutine({
      ...routine,
      segments: updated,
    });
  };

  const handleMoveSegment = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routine.segments.length) return;

    const updated = [...routine.segments];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    onChangeRoutine({
      ...routine,
      segments: updated,
    });
  };

  const handleTestAudio = (style: SoundEffectType) => {
    soundEngine.init();
    soundEngine.playCountdownPip(1, audioSettings.volume);
    setTimeout(() => {
      soundEngine.playTransition(style, audioSettings.volume);
    }, 280);
  };

  const handleSaveCurrent = () => {
    onSaveRoutine(routine);
    setSaveSuccessMsg('Routine saved to your browser!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300">
      {/* 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between gap-8 backdrop-blur-md">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-athletic text-2xl font-black uppercase tracking-tight leading-none text-white">
              PulseInterval
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 block">
              Training Session Timer
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation views */}
        <nav className="hidden md:flex items-center gap-2 p-1 rounded-xl bg-slate-800/60 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'editor'
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interval Builder
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Preset Routines
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
            Saved ({savedRoutines.length})
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onStartWorkout}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-athletic font-extrabold uppercase text-lg tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Training</span>
          </button>
        </div>
      </header>

      {/* MOBILE TAB BAR */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900 px-4 py-2 gap-2 text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 text-center rounded-lg ${
            activeTab === 'editor' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Builder
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 text-center rounded-lg ${
            activeTab === 'presets' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2 text-center rounded-lg ${
            activeTab === 'saved' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Saved ({savedRoutines.length})
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* PRESET ROUTINES BROWSER */}
        {activeTab === 'presets' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-athletic text-3xl font-black uppercase tracking-tight text-white">
                Starter Training Templates
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Select any verified workout protocol to instantly load its timing segments and background colors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STARTER_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    onSelectSavedOrPreset(preset);
                    setActiveTab('editor');
                  }}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                    routine.id === preset.id
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-athletic text-xl font-bold uppercase tracking-wide text-white">
                      {preset.name}
                    </h3>
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      {preset.rounds} Rounds
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {preset.description}
                  </p>

                  {/* Segment Color Pill Chain */}
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {preset.segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-3 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          backgroundColor: seg.color,
                          color: getContrastTextColor(seg.color),
                        }}
                        title={`${seg.name}: ${seg.durationSeconds}s`}
                      />
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {preset.segments.length} intervals · {preset.segments.map((s) => `${s.durationSeconds}s`).join('/')}
                    </span>
                    <span className="font-athletic font-bold text-amber-500 uppercase">
                      Load Routine →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAVED ROUTINES BROWSER */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-athletic text-3xl font-black uppercase tracking-tight text-white">
                Your Saved Routines
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Custom routines you have saved locally in your browser.
              </p>
            </div>

            {savedRoutines.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border bg-slate-900 border-slate-800">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <h3 className="font-athletic text-xl font-bold uppercase tracking-wide text-white">
                  No Saved Routines Yet
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Customize intervals in the Builder tab and click "Save Routine" to store them here for one-click access.
                </p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-athletic font-bold uppercase text-sm tracking-wider"
                >
                  Open Builder
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedRoutines.map((saved) => (
                  <div
                    key={saved.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      routine.id === saved.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-athletic text-xl font-bold uppercase tracking-wide text-white">
                        {saved.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedRoutine(saved.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title="Delete saved routine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 my-3">
                      {saved.segments.map((seg, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-3 rounded-full"
                          style={{ backgroundColor: seg.color }}
                          title={`${seg.name}: ${seg.durationSeconds}s`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                      <span>{saved.rounds} rounds · {saved.segments.length} segments</span>
                      <button
                        onClick={() => {
                          onSelectSavedOrPreset(saved);
                          setActiveTab('editor');
                        }}
                        className="font-athletic font-bold text-emerald-500 uppercase hover:underline"
                      >
                        Load →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORKOUT INTERVAL BUILDER TAB */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT 8 COLUMNS: SEGMENT TIMELINE BUILDER */}
            <div className="lg:col-span-8 space-y-6">
              {/* Routine Title, Description & Action Strip */}
              <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Routine Name
                    </label>
                    <input
                      type="text"
                      value={routine.name}
                      onChange={(e) => onChangeRoutine({ ...routine, name: e.target.value })}
                      className="w-full text-2xl sm:text-3xl font-athletic font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border bg-slate-950 border-slate-700 text-white focus:border-amber-500 transition-colors"
                      placeholder="e.g. 45s Warm Up / 15s Intense HIIT"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-end">
                    <button
                      onClick={handleSaveCurrent}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      title="Save routine to local browser storage"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Save Routine
                    </button>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Single Round
                    </span>
                    <span className="font-athletic text-2xl font-black text-white">
                      {formatTimeDisplay(singleRoundDuration).formatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Rounds / Sets
                    </span>
                    <span className="font-athletic text-2xl font-black text-amber-500">
                      {routine.rounds}x
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Total Workout
                    </span>
                    <span className="font-athletic text-2xl font-black text-emerald-400">
                      {formattedTotal.formatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION HEADER: TIMED INTERVAL SEGMENTS */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-athletic text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                    <span>Interval Segments</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {routine.segments.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Each segment gets its own color illumination, transition sound, and countdown.
                  </p>
                </div>

                <button
                  onClick={handleAddSegment}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-athletic font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Segment
                </button>
              </div>

              {/* SEGMENT CARDS LIST */}
              <div className="space-y-3">
                {routine.segments.map((segment, index) => {
                  const textColor = getContrastTextColor(segment.color);
                  const isColorPickerOpen = editingColorForId === segment.id;

                  return (
                    <div
                      key={segment.id}
                      className="p-4 sm:p-5 rounded-2xl border bg-slate-900 border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Reorder Stepper & Color Swatch */}
                        <div className="flex items-center gap-3">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveSegment(index, 'up')}
                              className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-400"
                              title="Move segment up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={index === routine.segments.length - 1}
                              onClick={() => handleMoveSegment(index, 'down')}
                              className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-400"
                              title="Move segment down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Color Visual Swatch Trigger */}
                          <button
                            onClick={() =>
                              setEditingColorForId(isColorPickerOpen ? null : segment.id)
                            }
                            className="w-12 h-12 rounded-xl border-2 border-white/40 shadow-md flex items-center justify-center font-athletic text-base font-black uppercase transition-transform hover:scale-105 shrink-0"
                            style={{
                              backgroundColor: segment.color,
                              color: textColor,
                            }}
                            title="Click to choose background color"
                          >
                            #{index + 1}
                          </button>

                          {/* Section Name & Quick Suggestions */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={segment.name}
                              onChange={(e) =>
                                handleUpdateSegment(segment.id, { name: e.target.value })
                              }
                              className="w-full font-athletic text-xl font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-slate-950 border-slate-700 text-white focus:border-amber-500 transition-colors"
                              placeholder="Section Name (e.g. Warm Up, Sprint)"
                            />

                            {/* Section suggestions quick click */}
                            <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1 text-[11px] text-slate-500">
                              <span className="opacity-60 text-[10px] uppercase">Quick:</span>
                              {['Warm Up', 'Sprint', 'Rest', 'Core'].map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSegment(segment.id, { name: suggestion })
                                  }
                                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: Duration Stepper & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          {/* Duration adjustment */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleUpdateSegment(segment.id, {
                                  durationSeconds: Math.max(5, segment.durationSeconds - 5),
                                })
                              }
                              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-200"
                              title="-5 seconds"
                            >
                              -5
                            </button>

                            <div className="flex flex-col items-center px-2">
                              <input
                                type="number"
                                min={1}
                                max={3600}
                                value={segment.durationSeconds}
                                onChange={(e) =>
                                  handleUpdateSegment(segment.id, {
                                    durationSeconds: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                className="w-18 text-center font-digits font-extrabold text-xl py-1 rounded-lg border bg-slate-950 border-slate-700 text-white focus:border-amber-500"
                              />
                              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                Seconds
                              </span>
                            </div>

                            <button
                              onClick={() =>
                                handleUpdateSegment(segment.id, {
                                  durationSeconds: segment.durationSeconds + 5,
                                })
                              }
                              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-200"
                              title="+5 seconds"
                            >
                              +5
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateSegment(segment.id, {
                                  durationSeconds: segment.durationSeconds + 15,
                                })
                              }
                              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-200"
                              title="+15 seconds"
                            >
                              +15
                            </button>
                          </div>

                          {/* Duplicate & Delete Segment */}
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                            <button
                              onClick={() => handleDuplicateSegment(segment.id)}
                              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="Duplicate segment"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              disabled={routine.segments.length <= 1}
                              onClick={() => handleDeleteSegment(segment.id)}
                              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 disabled:opacity-20 transition-colors"
                              title="Delete segment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* INLINE COLOR PALETTE PICKER DRAWER */}
                      {isColorPickerOpen && (
                        <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Choose Segment Background Color
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-300">
                                {segment.color}
                              </span>
                              {/* Custom native color picker */}
                              <input
                                type="color"
                                value={segment.color}
                                onChange={(e) =>
                                  handleUpdateSegment(segment.id, { color: e.target.value })
                                }
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                title="Pick custom color"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {ATHLETIC_COLOR_PRESETS.map((preset) => {
                              const isSelected = segment.color.toLowerCase() === preset.hex.toLowerCase();
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSegment(segment.id, { color: preset.hex })
                                  }
                                  className={`h-10 rounded-xl p-1 flex items-center justify-center font-athletic text-xs font-bold uppercase transition-transform hover:scale-105 relative ${
                                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                                  }`}
                                  style={{
                                    backgroundColor: preset.hex,
                                    color: getContrastTextColor(preset.hex),
                                  }}
                                  title={preset.name}
                                >
                                  {isSelected && <Check className="w-4 h-4" />}
                                  {!isSelected && <span>{preset.name.split(' ')[0]}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Segment Big Button */}
              <button
                onClick={handleAddSegment}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500 text-slate-400 hover:text-amber-500 bg-slate-900/50 flex items-center justify-center gap-2 font-athletic text-base font-bold uppercase tracking-wider transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Another Interval Segment
              </button>
            </div>

            {/* RIGHT 4 COLUMNS: GLOBAL SETTINGS & AUDIO CONTROLS */}
            <div className="lg:col-span-4 space-y-6">
              {/* Routine Session Controls */}
              <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800">
                <h3 className="font-athletic text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-white">
                  <span>Session Settings</span>
                </h3>

                {/* Rounds Stepper */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Rounds / Repeat Sets
                    </label>
                    <span className="font-athletic text-lg font-black text-amber-500">
                      {routine.rounds} {routine.rounds === 1 ? 'Round' : 'Rounds'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onChangeRoutine({
                          ...routine,
                          rounds: Math.max(1, routine.rounds - 1),
                        })
                      }
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-lg text-white"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={routine.rounds}
                      onChange={(e) =>
                        onChangeRoutine({
                          ...routine,
                          rounds: parseInt(e.target.value) || 1,
                        })
                      }
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <button
                      onClick={() =>
                        onChangeRoutine({
                          ...routine,
                          rounds: Math.min(50, routine.rounds + 1),
                        })
                      }
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-lg text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Preparation Countdown */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Preparation Time
                    </label>
                    <span className="text-xs font-bold font-digits text-white">
                      {routine.prepDurationSeconds}s countdown
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 5, 10, 15].map((sec) => (
                      <button
                        key={sec}
                        onClick={() =>
                          onChangeRoutine({ ...routine, prepDurationSeconds: sec })
                        }
                        className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                          routine.prepDurationSeconds === sec
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec === 0 ? 'None' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cooldown Period */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Cool Down Period
                    </label>
                    <span className="text-xs font-bold font-digits text-white">
                      {routine.cooldownSeconds || 0}s
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 30, 60, 120].map((sec) => (
                      <button
                        key={sec}
                        onClick={() =>
                          onChangeRoutine({ ...routine, cooldownSeconds: sec })
                        }
                        className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                          (routine.cooldownSeconds || 0) === sec
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec === 0 ? 'None' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AUDIBLE CUES & SOUND CONFIGURATION */}
              <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-athletic text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                    <Volume2 className="w-5 h-5 text-amber-500" />
                    <span>Audible Cues</span>
                  </h3>

                  <button
                    onClick={() =>
                      onUpdateAudioSettings({
                        ...audioSettings,
                        soundEnabled: !audioSettings.soundEnabled,
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                      audioSettings.soundEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {audioSettings.soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        Muted
                      </>
                    )}
                  </button>
                </div>

                {/* Transition Sound Style */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Transition Audio Tone
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'beeps', label: 'Athletic Beeps' },
                        { id: 'boxing_bell', label: 'Boxing Bell' },
                        { id: 'whistle', label: 'Coach Whistle' },
                        { id: 'chime', label: 'Zen Chime' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            const newStyle = style.id as SoundEffectType;
                            onUpdateAudioSettings({
                              ...audioSettings,
                              soundStyle: newStyle,
                            });
                            handleTestAudio(newStyle);
                          }}
                          className={`p-2.5 rounded-xl text-left border text-xs font-semibold uppercase tracking-wide flex items-center justify-between transition-colors ${
                            audioSettings.soundStyle === style.id
                              ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                              : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{style.label}</span>
                          <span className="text-[10px] opacity-60">Test</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Volume Level
                      </span>
                      <span className="text-xs font-digits text-white">
                        {Math.round(audioSettings.volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={audioSettings.volume}
                      onChange={(e) =>
                        onUpdateAudioSettings({
                          ...audioSettings,
                          volume: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Voice Prompts Toggle */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block text-white">
                        Voice Announcements
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Calls out section names (e.g. "Sprint", "Rest")
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={audioSettings.voicePromptEnabled}
                      onChange={(e) =>
                        onUpdateAudioSettings({
                          ...audioSettings,
                          voicePromptEnabled: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* START WORKOUT PRIMARY CTA CARD */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 text-slate-950 shadow-xl space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest opacity-80 block">
                    Ready to Train?
                  </span>
                  <h4 className="font-athletic text-3xl font-black uppercase tracking-tight leading-none">
                    Enter Full Screen
                  </h4>
                  <p className="text-xs font-medium opacity-90 mt-1">
                    Transforms browser into high-contrast visual display with countdown beeps.
                  </p>
                </div>

                <button
                  onClick={onStartWorkout}
                  className="w-full py-4 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-athletic font-extrabold text-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-transform active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-current text-amber-400" />
                  <span>Start Training Session</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
