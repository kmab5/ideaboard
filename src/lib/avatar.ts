// =============================================================================
// Avatar generation (DiceBear)
// =============================================================================
// Avatars are generated locally as SVG data-URIs using @dicebear/core so that
// the preview shown in the picker is byte-for-byte identical to what we persist
// in `profiles.avatar_url`. This avoids the previous bug where previews used the
// local v9 renderer but saved a mismatched `api.dicebear.com/7.x/...` URL, and
// removes the runtime dependency on an external avatar service.

import { createAvatar, type Style } from '@dicebear/core';
import {
  adventurer,
  avataaars,
  bottts,
  funEmoji,
  lorelei,
  micah,
  miniavs,
  personas,
} from '@dicebear/collection';
import type { DicebearStyle } from '@/types/database';

/** DiceBear styles exposed in the picker, with display labels. */
export const DICEBEAR_STYLES: {
  value: DicebearStyle;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DiceBear style option maps are heavily generic
  style: Style<any>;
}[] = [
  { value: 'adventurer', label: 'Adventurer', style: adventurer },
  { value: 'avataaars', label: 'Avataaars', style: avataaars },
  { value: 'bottts', label: 'Bottts', style: bottts },
  { value: 'fun-emoji', label: 'Fun Emoji', style: funEmoji },
  { value: 'lorelei', label: 'Lorelei', style: lorelei },
  { value: 'micah', label: 'Micah', style: micah },
  { value: 'miniavs', label: 'Miniavs', style: miniavs },
  { value: 'personas', label: 'Personas', style: personas },
];

export const DEFAULT_DICEBEAR_STYLE: DicebearStyle = 'adventurer';

const STYLE_BY_VALUE = new Map(DICEBEAR_STYLES.map((s) => [s.value, s.style]));

/** Whether a style value is one we can render locally. */
export function isSupportedDicebearStyle(style: string): style is DicebearStyle {
  return STYLE_BY_VALUE.has(style as DicebearStyle);
}

/** A short, URL-safe random seed for new avatars. */
export function generateAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a DiceBear avatar as an SVG data-URI.
 *
 * Unknown styles fall back to the default so a bad value never breaks rendering.
 */
export function generateDicebearDataUri(style: DicebearStyle, seed: string): string {
  const styleConfig = STYLE_BY_VALUE.get(style) ?? STYLE_BY_VALUE.get(DEFAULT_DICEBEAR_STYLE)!;
  return createAvatar(styleConfig, { seed, size: 128 }).toDataUri();
}
