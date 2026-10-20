/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  category: 'work' | 'rest' | 'prep' | 'cardio' | 'power' | 'stretch';
  suggestedLabel: string;
}

export const ATHLETIC_COLOR_PRESETS: ColorPreset[] = [
  { id: 'flame-red', name: 'Flame Red', hex: '#EF4444', category: 'work', suggestedLabel: 'High Intensity Sprint' },
  { id: 'crimson-burst', name: 'Crimson Burst', hex: '#DC2626', category: 'work', suggestedLabel: 'Max Effort / Sprints' },
  { id: 'vivid-orange', name: 'Vivid Orange', hex: '#F97316', category: 'work', suggestedLabel: 'High Power Interval' },
  { id: 'solar-amber', name: 'Solar Amber', hex: '#F59E0B', category: 'prep', suggestedLabel: 'Warm Up / Build' },
  { id: 'electric-yellow', name: 'Electric Yellow', hex: '#EAB308', category: 'prep', suggestedLabel: 'Ready / Transition' },
  { id: 'emerald-recovery', name: 'Emerald Rest', hex: '#10B981', category: 'rest', suggestedLabel: 'Active Recovery' },
  { id: 'mint-breathe', name: 'Mint Breathe', hex: '#059669', category: 'rest', suggestedLabel: 'Rest & Hydrate' },
  { id: 'laser-cyan', name: 'Laser Cyan', hex: '#06B6D4', category: 'cardio', suggestedLabel: 'Aerobic Cardio' },
  { id: 'cobalt-power', name: 'Cobalt Power', hex: '#2563EB', category: 'power', suggestedLabel: 'Strength Circuit' },
  { id: 'deep-indigo', name: 'Deep Indigo', hex: '#4F46E5', category: 'power', suggestedLabel: 'Core & Stability' },
  { id: 'electric-violet', name: 'Electric Violet', hex: '#8B5CF6', category: 'stretch', suggestedLabel: 'Mobility & Form' },
  { id: 'hot-magenta', name: 'Hot Magenta', hex: '#EC4899', category: 'work', suggestedLabel: 'Finisher Burn' },
  { id: 'teal-cooldown', name: 'Teal Cooldown', hex: '#0D9488', category: 'stretch', suggestedLabel: 'Cool Down Stretch' },
  { id: 'stealth-charcoal', name: 'Stealth Charcoal', hex: '#334155', category: 'rest', suggestedLabel: 'Low Pace / Walk' },
];

/**
 * Calculates optimal text color ('#ffffff' or '#0f172a') for any given background hex
 * using WCAG 2.1 relative luminance calculation.
 */
export function getContrastTextColor(hexColor: string): '#ffffff' | '#0f172a' {
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) {
    return '#ffffff';
  }

  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  // Convert to sRGB luminance
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;

  // If luminance is high (bright background), use dark text; otherwise white text
  return luminance > 0.45 ? '#0f172a' : '#ffffff';
}

/**
 * Formats seconds into MM:SS or SS format.
 */
export function formatTimeDisplay(totalSeconds: number): { formatted: string; minutes: string; seconds: string } {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.floor(Math.max(0, totalSeconds) % 60);

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  return {
    formatted: mins > 0 ? `${mins}:${ss}` : `${secs}`,
    minutes: mm,
    seconds: ss,
  };
}
