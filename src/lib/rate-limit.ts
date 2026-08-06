import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Scope note (see SECURITY.md): only requests that actually pass through this
// Next.js server can be rate-limited here. Board/note/component mutations and
// Supabase auth calls go directly from the browser to Supabase and are NOT
// covered — Supabase's own auth rate limits apply to those instead.
// ---------------------------------------------------------------------------

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const isConfigured = Boolean(url && token);

if (!isConfigured && process.env.NODE_ENV === 'production') {
  // Don't throw — an unconfigured limiter should fail open, not take the site
  // down. Just make the gap visible in logs.
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled.'
  );
}

const redis = isConfigured ? new Redis({ url: url!, token: token! }) : null;

function makeLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h'}`, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `ideaboard:${prefix}`,
  });
}

// Sensitive & irreversible — a handful per hour is more than any real user needs.
const accountDeleteLimiter = makeLimiter(3, '1 h', 'account-delete');

// General per-IP throttle across the whole app, applied in middleware. This is
// basic abuse/DoS protection for the server itself, not a per-feature limit.
const generalLimiter = makeLimiter(300, '1 m', 'general');

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

async function check(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    // Fail open when unconfigured (e.g. local dev without Upstash credentials).
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  const result = await limiter.limit(identifier);
  return result;
}

/** Rate limit for `POST /api/account/delete`, keyed by the authenticated user id. */
export function checkAccountDeleteLimit(userId: string) {
  return check(accountDeleteLimiter, userId);
}

/** General per-IP throttle for all requests, applied in middleware. */
export function checkGeneralLimit(ip: string) {
  return check(generalLimiter, ip);
}

export const rateLimitConfigured = isConfigured;
