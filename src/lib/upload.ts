// =============================================================================
// Upload validation
// =============================================================================
// Client-side validation is a first line of defence only. Matching size and
// MIME-type limits MUST also be configured on the Supabase Storage buckets,
// since anything sent from the browser can be forged.

export const MB = 1024 * 1024;

/** Max size for user avatar uploads (PRD 4.8.3). */
export const AVATAR_MAX_BYTES = 5 * MB;

/** Max size for note image attachments (PRD 4.2.4). */
export const NOTE_IMAGE_MAX_BYTES = 10 * MB;

/**
 * Raster image types we accept for uploads.
 *
 * SVG is intentionally excluded: it can embed scripts and, when served from a
 * public Storage origin, becomes a stored-XSS vector. The PRD lists SVG, but we
 * deviate here for safety until server-side sanitization exists.
 */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const EXTENSION_BY_TYPE: Record<AllowedImageType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / MB)}MB`;
}

/**
 * Validate an uploaded image file against an allow-list of MIME types and a
 * maximum size. Returns a structured result so callers can surface the message.
 */
export function validateImageFile(file: File, maxBytes: number): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return { valid: false, error: 'Only PNG, JPG, WebP, and GIF images are allowed' };
  }

  if (file.size > maxBytes) {
    return { valid: false, error: `Image must be less than ${formatMegabytes(maxBytes)}` };
  }

  return { valid: true };
}

/**
 * Derive a safe file extension from the file's validated MIME type rather than
 * trusting the (attacker-controllable) original filename.
 */
export function safeExtensionForType(type: string): string {
  return EXTENSION_BY_TYPE[type as AllowedImageType] ?? 'bin';
}
