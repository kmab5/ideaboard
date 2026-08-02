import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  safeExtensionForType,
  AVATAR_MAX_BYTES,
  NOTE_IMAGE_MAX_BYTES,
  MB,
} from './upload';

function makeFile(type: string, size: number): File {
  // File in Node 18+ / jsdom-free: construct via Blob-like object.
  const blob = new Blob([new Uint8Array(0)], { type });
  return Object.defineProperty(new File([blob], 'x', { type }), 'size', {
    value: size,
  }) as File;
}

describe('validateImageFile', () => {
  it('accepts allowed raster types within the limit', () => {
    expect(validateImageFile(makeFile('image/png', 1024), AVATAR_MAX_BYTES).valid).toBe(true);
    expect(validateImageFile(makeFile('image/jpeg', 1024), AVATAR_MAX_BYTES).valid).toBe(true);
    expect(validateImageFile(makeFile('image/webp', 1024), AVATAR_MAX_BYTES).valid).toBe(true);
    expect(validateImageFile(makeFile('image/gif', 1024), AVATAR_MAX_BYTES).valid).toBe(true);
  });

  it('rejects SVG and other disallowed types', () => {
    const svg = validateImageFile(makeFile('image/svg+xml', 100), AVATAR_MAX_BYTES);
    expect(svg.valid).toBe(false);
    expect(svg.error).toMatch(/allowed/i);
    expect(validateImageFile(makeFile('text/html', 100), AVATAR_MAX_BYTES).valid).toBe(false);
    expect(validateImageFile(makeFile('application/pdf', 100), AVATAR_MAX_BYTES).valid).toBe(false);
  });

  it('rejects files over the size limit', () => {
    const result = validateImageFile(makeFile('image/png', AVATAR_MAX_BYTES + 1), AVATAR_MAX_BYTES);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/less than/i);
  });

  it('uses the provided limit', () => {
    const bigButValid = makeFile('image/png', 6 * MB);
    expect(validateImageFile(bigButValid, AVATAR_MAX_BYTES).valid).toBe(false);
    expect(validateImageFile(bigButValid, NOTE_IMAGE_MAX_BYTES).valid).toBe(true);
  });
});

describe('safeExtensionForType', () => {
  it('maps known types to extensions', () => {
    expect(safeExtensionForType('image/png')).toBe('png');
    expect(safeExtensionForType('image/jpeg')).toBe('jpg');
    expect(safeExtensionForType('image/webp')).toBe('webp');
    expect(safeExtensionForType('image/gif')).toBe('gif');
  });

  it('falls back to bin for unknown types', () => {
    expect(safeExtensionForType('image/svg+xml')).toBe('bin');
    expect(safeExtensionForType('anything')).toBe('bin');
  });
});
