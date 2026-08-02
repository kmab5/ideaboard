// =============================================================================
// Navigation helpers
// =============================================================================

/**
 * Sanitize a user-supplied post-auth redirect target.
 *
 * Only same-origin, absolute *path* redirects are permitted. Anything that
 * could escape the current origin — protocol-relative URLs (`//evil.com`),
 * absolute URLs (`https://evil.com`), backslash tricks (`/\evil.com`) or
 * control characters — is rejected and replaced with `fallback`.
 *
 * This prevents open-redirect abuse of the OAuth callback's `next` parameter.
 *
 * @param next The raw, untrusted redirect value (e.g. from a query string).
 * @param fallback Safe default path to use when `next` is missing or invalid.
 * @returns A path that always begins with a single `/`.
 */
export function sanitizeRedirectPath(
  next: string | null | undefined,
  fallback = '/stories'
): string {
  if (!next) return fallback;

  // Must be an absolute path on this origin.
  if (!next.startsWith('/')) return fallback;

  // Reject protocol-relative ("//host") and backslash-normalized ("/\host")
  // paths, which browsers can treat as cross-origin.
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;

  // Reject anything containing control characters or a scheme separator.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(next) || next.includes('://')) {
    return fallback;
  }

  return next;
}
