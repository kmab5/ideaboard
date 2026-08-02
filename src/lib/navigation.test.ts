import { describe, it, expect, afterEach } from 'vitest';
import { sanitizeRedirectPath, getSiteUrl } from './navigation';

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

describe('getSiteUrl', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    process.env.VERCEL_URL = originalVercelUrl;
  });

  it('adds a scheme to a bare host (the Vercel misconfig case)', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'ideaboard-cs.vercel.app';
    expect(getSiteUrl()).toBe('https://ideaboard-cs.vercel.app/');
  });

  it('preserves an explicit scheme', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    expect(getSiteUrl()).toBe('https://example.com/');
  });

  it('falls back to VERCEL_URL when APP_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = 'preview-abc.vercel.app';
    expect(getSiteUrl()).toBe('https://preview-abc.vercel.app/');
  });

  it('falls back to localhost when nothing is set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    expect(getSiteUrl()).toBe('http://localhost:3000/');
  });
});
