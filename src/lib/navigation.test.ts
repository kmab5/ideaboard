import { describe, it, expect } from 'vitest';
import { sanitizeRedirectPath } from './navigation';

describe('sanitizeRedirectPath', () => {
  it('allows simple same-origin paths', () => {
    expect(sanitizeRedirectPath('/stories')).toBe('/stories');
    expect(sanitizeRedirectPath('/board/123?tab=notes')).toBe('/board/123?tab=notes');
    expect(sanitizeRedirectPath('/settings#section')).toBe('/settings#section');
  });

  it('falls back when value is missing', () => {
    expect(sanitizeRedirectPath(null)).toBe('/stories');
    expect(sanitizeRedirectPath(undefined)).toBe('/stories');
    expect(sanitizeRedirectPath('')).toBe('/stories');
  });

  it('respects a custom fallback', () => {
    expect(sanitizeRedirectPath(null, '/login')).toBe('/login');
  });

  it('rejects protocol-relative URLs (open redirect)', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/stories');
    expect(sanitizeRedirectPath('//evil.com/path')).toBe('/stories');
  });

  it('rejects backslash-normalized paths', () => {
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/stories');
  });

  it('rejects absolute URLs and schemes', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/stories');
    expect(sanitizeRedirectPath('javascript://alert(1)')).toBe('/stories');
    expect(sanitizeRedirectPath('http://evil.com')).toBe('/stories');
  });

  it('rejects non-absolute paths', () => {
    expect(sanitizeRedirectPath('stories')).toBe('/stories');
    expect(sanitizeRedirectPath('../secret')).toBe('/stories');
  });

  it('rejects control characters', () => {
    expect(sanitizeRedirectPath('/foo\nbar')).toBe('/stories');
    expect(sanitizeRedirectPath('/foo\u0000bar')).toBe('/stories');
  });
});
