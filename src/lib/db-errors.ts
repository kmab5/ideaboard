// =============================================================================
// Database error helpers
// =============================================================================

/** Postgres SQLSTATE raised by the write rate-limit trigger (migration 004). */
const RATE_LIMIT_CODE = '53400';

interface MaybePostgrestError {
  code?: string;
  message?: string;
}

/** Whether an error came from the database-level write rate limit. */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as MaybePostgrestError;
  return err.code === RATE_LIMIT_CODE || Boolean(err.message?.includes('Rate limit exceeded'));
}

/**
 * A message suitable for a toast. Rate-limit errors get a specific, actionable
 * message; everything else falls back to the caller's wording so we don't leak
 * raw database text into the UI.
 */
export function friendlyDbError(error: unknown, fallback: string): string {
  if (isRateLimitError(error)) {
    return 'Too many changes at once — pause for a moment and try again.';
  }
  return fallback;
}
