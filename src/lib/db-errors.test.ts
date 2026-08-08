import { describe, it, expect } from 'vitest';
import { isRateLimitError, friendlyDbError } from './db-errors';

describe('isRateLimitError', () => {
  it('detects the rate-limit SQLSTATE', () => {
    expect(isRateLimitError({ code: '53400' })).toBe(true);
  });

  it('detects the message as a fallback', () => {
    expect(isRateLimitError({ message: 'Rate limit exceeded: too many changes' })).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isRateLimitError({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
    expect(isRateLimitError('boom')).toBe(false);
  });
});

describe('friendlyDbError', () => {
  it('gives an actionable message for rate limiting', () => {
    expect(friendlyDbError({ code: '53400' }, 'Failed to save')).toMatch(/too many changes/i);
  });

  it('uses the caller fallback otherwise, not raw database text', () => {
    expect(friendlyDbError({ message: 'null value in column "x"' }, 'Failed to save')).toBe(
      'Failed to save'
    );
  });
});
