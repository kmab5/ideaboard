// =============================================================================
// Canvas constants
// =============================================================================
// Single source of truth for note colors, connection colors, and default sizes,
// previously duplicated across the canvas and note components.

export interface NoteColor {
  value: string;
  label: string;
  /** Tailwind background utility for the swatch/card. */
  bg: string;
}

export const NOTE_COLORS: NoteColor[] = [
  { value: '#FDFCF8', label: 'Paper', bg: 'bg-[#FDFCF8]' },
  { value: '#FFF9C4', label: 'Yellow', bg: 'bg-yellow-100' },
  { value: '#FFCCBC', label: 'Orange', bg: 'bg-orange-100' },
  { value: '#F8BBD9', label: 'Pink', bg: 'bg-pink-100' },
  { value: '#E1BEE7', label: 'Purple', bg: 'bg-purple-100' },
  { value: '#C5CAE9', label: 'Indigo', bg: 'bg-indigo-100' },
  { value: '#BBDEFB', label: 'Blue', bg: 'bg-blue-100' },
  { value: '#B2DFDB', label: 'Teal', bg: 'bg-teal-100' },
  { value: '#C8E6C9', label: 'Green', bg: 'bg-green-100' },
];

export const NOTE_COLOR_VALUES: string[] = NOTE_COLORS.map((c) => c.value);

/** Map of hex value -> Tailwind background utility, for quick class lookup. */
export const NOTE_COLOR_BG: Record<string, string> = Object.fromEntries(
  NOTE_COLORS.map((c) => [c.value, c.bg])
);

/** Palette used when assigning a color to a new connection. */export const CONNECTION_COLORS: string[] = [
  '#6B6B78', // warm gray (default)
  '#E0503F', // red
  '#E8823A', // orange
  '#F5C451', // highlight amber
  '#3DE08A', // signal green
  '#3B9BE8', // blue
  '#6D4AFF', // brand indigo-violet
  '#E85D9E', // rose
];

export const DEFAULT_NOTE_SIZE = { width: 200, height: 150 } as const;
export const MIN_NOTE_SIZE = { width: 150, height: 100 } as const;
export const DEFAULT_DRAWING_SIZE = { width: 300, height: 200 } as const;

/** Max ms between taps to register a double-tap on touch devices. */
export const DOUBLE_TAP_DELAY_MS = 350;

/** Pick a random element from a non-empty array. */
export function randomFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Palette for container borders/tints (PRD 4.7.2 "Color"). */
export const CONTAINER_COLORS: string[] = [
  '#6D4AFF', // brand indigo-violet
  '#0E9BA8', // teal
  '#3DE08A', // signal green
  '#F5C451', // highlight amber
  '#E85D9E', // rose
  '#6B6B78', // warm gray
];

export const DEFAULT_CONTAINER_SIZE = { width: 480, height: 360 } as const;

/** Grid spacing (px) used by snap-to-grid; matches the dot Background gap. */
export const GRID_SIZE = 20;
export const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE];
