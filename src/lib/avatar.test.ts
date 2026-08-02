import { describe, it, expect } from 'vitest';
import {
  generateDicebearDataUri,
  generateAvatarSeed,
  isSupportedDicebearStyle,
  DICEBEAR_STYLES,
  DEFAULT_DICEBEAR_STYLE,
} from './avatar';

describe('generateDicebearDataUri', () => {
  it('produces an SVG data-URI', () => {
    const uri = generateDicebearDataUri('adventurer', 'seed-1');
    expect(uri.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('is deterministic for the same style + seed', () => {
    expect(generateDicebearDataUri('bottts', 'abc')).toBe(generateDicebearDataUri('bottts', 'abc'));
  });

  it('differs for different seeds', () => {
    expect(generateDicebearDataUri('bottts', 'abc')).not.toBe(
      generateDicebearDataUri('bottts', 'xyz')
    );
  });

  it('falls back gracefully for an unsupported style', () => {
    // 'pixel-art' is a valid DB enum value but not in the local picker set.
    const uri = generateDicebearDataUri('pixel-art', 'seed');
    expect(uri.startsWith('data:image/svg+xml')).toBe(true);
    expect(uri).toBe(generateDicebearDataUri(DEFAULT_DICEBEAR_STYLE, 'seed'));
  });
});

describe('isSupportedDicebearStyle', () => {
  it('recognizes styles in the picker set', () => {
    for (const s of DICEBEAR_STYLES) {
      expect(isSupportedDicebearStyle(s.value)).toBe(true);
    }
  });

  it('rejects unknown styles', () => {
    expect(isSupportedDicebearStyle('not-a-style')).toBe(false);
  });
});

describe('generateAvatarSeed', () => {
  it('produces non-empty, varying seeds', () => {
    const a = generateAvatarSeed();
    const b = generateAvatarSeed();
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});
