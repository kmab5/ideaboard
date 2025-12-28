import { z } from 'zod';
import { displayNameSchema } from './auth';

// =============================================================================
// PROFILE VALIDATION SCHEMAS
// =============================================================================

const dicebearStyleSchema = z.enum([
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral',
  'shapes',
  'thumbs',
]);

export const profileUpdateSchema = z.object({
  display_name: displayNameSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').nullable().optional(),
  avatar_type: z.enum(['custom', 'dicebear']).optional(),
  dicebear_seed: z.string().max(255).nullable().optional(),
  dicebear_style: dicebearStyleSchema.optional(),
  avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
