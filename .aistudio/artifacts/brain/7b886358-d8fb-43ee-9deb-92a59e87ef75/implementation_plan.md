# PulseInterval: Visual Training Session & Interval Timer

PulseInterval is a high-visibility, full-screen training timer designed for coaches, athletes, gym trainers, and presentation runners to visualize time periods with high-contrast color shifts, massive typography, synthesized audible countdown cues, and customizable routines.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your response, the following design and functional choices are confirmed for implementation:
> - **Sound Design**: Precision Web Audio API engine providing synthesized 3-second athletic countdown beeps (`880Hz` alert pips) and transition impact gong/bell tone (`440Hz` harmonic decay), with volume and mute toggles.
> - **Fullscreen Presentation**: Ultra-legible massive digital numerals (`tabular-nums`, up to `text-[22vw]`), synchronized circular/progress bar visualization, large section kicker and title, and an "Up Next" segment preview card with transition countdown.
> - **Routine Management & Presets**: Built-in battle-tested templates (HIIT 45/15, Tabata 20/10, EMOM 60s, Boxing 3min/1min, Circuit 50/10) alongside an interactive custom sequence builder with drag-and-drop/reorder, custom color pickers, set repetitions, and browser localStorage persistence.
> - **Night & Gym Visibility**: Dual-mode engine with vibrant full-screen color flood mode (dynamic segment background color) and high-contrast dark mode with glowing perimeter accents for dimly lit workout spaces.

---

## 1. Overview & Core Concept

- **What It Does**: PulseInterval allows trainers and individuals to structure interval sessions with custom segment names, durations, background colors, and audible signals. In active mode, the app transitions into an immersive, distraction-free full-screen display that transforms the entire screen into a colored visual beacon visible from across a training studio, gym floor, or stage.
- **Target Audience / Persona**: Personal trainers, HIIT/circuit gym coaches, martial arts instructors, runners, CrossFit athletes, and workshop facilitators running timed sprints or exercises.
- **Key Value**: Eliminates the need to squint at phone screens or small stopwatches; delivers high-contrast visual cues with synchronized audio countdowns so participants always know their current interval, remaining time, and what's coming next.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Routine Setup & Customization**:
   - The user selects a starter preset (HIIT, Tabata, EMOM, Boxing 3-Min, 5-Stage Circuit) or builds from scratch.
   - For each segment: customize section title (e.g., "Warm Up", "High Intensity Sprint", "Active Recovery", "Core Burn"), duration in seconds/minutes, and pick from a curated athletic palette (Crimson Burst, Electric Lime, Laser Cyan, Vivid Amber, Deep Violet, Stealth Charcoal) or custom hex color.
   - Adjust global settings: set repetitions (1 to 20 rounds), 5-second preparation countdown, cooldown, and audio cue volume.
   - Save routines to local storage with custom names (e.g., "Morning Kettlebell Circuit", "Sprint Drills").
2. **Full-Screen Workout Execution**:
   - Clicking "Start Training" enters full-screen mode (using the HTML5 Fullscreen API with screen Wake Lock to prevent screen sleep).
   - Display fills 100% of the screen with the segment's custom background color.
   - Shows colossal countdown digits (`font-mono tabular-nums`), section title (`text-4xl` to `text-6xl font-black uppercase tracking-wider`), current round counter (e.g. `Set 2 / 4`), and a progress bar or circular arc.
   - An "Up Next" preview banner gives advance notice of the upcoming segment and color.
3. **Audio & Visual Transitions**:
   - When 3 seconds remain: audible 3-2-1 countdown beeps sound with subtle visual number scaling.
   - At 0:00: loud resonant transition chime/gong triggers, the background color switches to the next segment's color, and the next segment begins seamlessly.
4. **Workout Controls & Dark Mode**:
   - Single tap or Spacebar pauses/resumes. Arrow keys skip forward/backward between segments.
   - Dedicated Dark Mode toggle alters the active screen from full color flood to deep OLED black (`#090d16`) with high-intensity colored borders, neon typography, and minimal glare for night sessions.

### Visual Identity & Theme
- **Color System (Athletic & High Contrast)**:
  - *Sprint / Work*: Vibrant Coral Red (`#ef4444`) or Intense Tangerine (`#f97316`)
  - *Warm Up / Prep*: Golden Amber (`#f59e0b`) or Electric Gold (`#eab308`)
  - *Recovery / Rest*: High-Visibility Emerald (`#10b981`) or Cool Mint (`#14b8a6`)
  - *Focus / Cardio*: Electric Cyan (`#06b6d4`) or Royal Cobalt (`#3b82f6`)
  - *Cool Down*: Violet Dusk (`#8b5cf6`)
  - *Dark Mode Canvas*: Deep Slate Obsidian (`#090d16`), with text rendered in ultra-crisp white/amber for maximum contrast.
- **Typography**:
  - *Display / Section Title*: `Barlow Condensed` / `Oswald` / `Plus Jakarta Sans` (`font-black uppercase tracking-tight`)
  - *Timer Digits*: Tabular monospace figures (`font-mono tabular-nums font-black`)
- **Interaction & Ergonomics**:
  - Minimum 48px touch hitboxes for all mobile/tablet controls.
  - Keyboard shortcuts: `Space` (Pause/Resume), `Right Arrow` (Next), `Left Arrow` (Prev), `F` (Toggle Fullscreen), `M` (Mute Audio), `R` (Restart).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Web Audio API vs Audio Files**:
  - *Chosen Approach*: Synthesize pure tones (oscillators with gain decay envelopes) using native browser Web Audio API.
  - *Why*: Eliminates loading delays, broken external audio URLs, and network latency; guarantees immediate, zero-latency 3-2-1 beeps even offline.
  - *Alternatives Considered*: Bundling MP3 files (prone to latency on mobile iOS Safari and audio context blocking).
- **Decision 2: Dual Screen Modes (Flood Color vs. Night OLED Glow)**:
  - *Chosen Approach*: Provide both a "Full Canvas Flood" (entire viewport background matches the segment color) and a "Night / Dark Room" mode (deep black background with giant colored typography, progress rings, and outer edge glow).
  - *Why*: Bright color floods work best in bright gyms and outdoor turf sessions; night mode prevents blinding trainers in dark studios, yoga rooms, or evening workouts.
- **Decision 3: Screen Wake Lock API**:
  - *Chosen Approach*: Request `navigator.wakeLock.request('screen')` during active timer playback.
  - *Why*: Prevents mobile phones, tablets, or laptops from dimming or sleeping during a 45-minute training routine.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PulseInterval Web App                           │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      App State & Storage                       │   │
│   │  • activeRoutine: { id, name, rounds, prepSec, segments: [...] }│   │
│   │  • playbackState: { isRunning, currentSegIdx, currentRound,   │   │
│   │                     timeLeftSec, totalElapsedSec }             │   │
│   │  • preferences: { isDarkMode, isMuted, soundPreset, wakeLock } │   │
│   │  • savedRoutines: Routine[] (persisted in localStorage)        │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│                 ┌─────────────────┴─────────────────┐                  │
│                 ▼                                   ▼                  │
│   ┌───────────────────────────┐       ┌────────────────────────────┐   │
│   │    Routine Builder View   │       │   Full-Screen Timer View   │   │
│   │ • Preset selector tabs    │       │ • Massive timer display    │   │
│   │ • Segment reordering/edit │       │ • Dynamic background flood │   │
│   │ • Color & duration pickers│       │ • Circular progress ring   │   │
│   │ • Round & prep controls   │       │ • "Up Next" preview bar    │   │
│   │ • Sound test trigger      │       │ • Pause/Skip/Exit overlay  │   │
│   └─────────────┬─────────────┘       └─────────────┬──────────────┘   │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │               Audio & Hardware Driver Modules                  │   │
│   │  • Web Audio Sound Engine (Oscillator 3-2-1 & gong envelope)   │   │
│   │  • HTML5 Fullscreen API Driver (requestFullscreen / exit)      │   │
│   │  • Screen WakeLock API Controller                              │   │
│   │  • Keyboard Shortcuts Controller (Space, Arrows, F, M)         │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Entities & Model

```typescript
export interface IntervalSegment {
  id: string;
  name: string;             // e.g. "Warm Up", "Sprint", "Rest"
  durationSeconds: number;  // e.g. 45
  color: string;            // e.g. "#ef4444"
  textColor?: string;       // auto-calculated contrast or custom
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  prepDurationSeconds: number; // e.g. 5
  rounds: number;              // e.g. 4 sets
  cooldownSeconds?: number;    // e.g. 60
  segments: IntervalSegment[];
}
```

### Interactive State Transitions
- **`START` / `RESUME`**: Activates `requestWakeLock()`, starts high-precision `requestAnimationFrame` / `setInterval` timer tick, transitions to Fullscreen display.
- **`TICK (timeLeft <= 3)`**: Plays synthesized short beep (`880Hz`, 120ms duration) on 3, 2, and 1.
- **`TRANSITION (timeLeft === 0)`**: Plays resonant harmonic impact tone (`440Hz` fundamental with `880Hz` overtone and 800ms exponential decay), advances `currentSegIdx`, updates background color CSS variables with smooth transition, or increments `currentRound`.
- **`FINISH`**: Plays triumphal celebratory chime sequence, displays total elapsed workout summary (total duration, sets completed, calories/work estimate), and releases WakeLock.
