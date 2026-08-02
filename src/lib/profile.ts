// =============================================================================
// Profile helpers
// =============================================================================

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import { generateDicebearDataUri, DEFAULT_DICEBEAR_STYLE } from '@/lib/avatar';

/**
 * Best display name for a user, preferring explicit metadata and falling back
 * to the local part of their email.
 */
export function deriveDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  return (
    (meta.display_name as string | undefined) ||
    (meta.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'User'
  );
}

/**
 * Fetch the user's profile, creating a default one if it doesn't exist yet.
 *
 * A database trigger normally creates the profile on signup; this is the
 * client-side backup for cases where the trigger didn't run (e.g. some OAuth
 * flows). Centralizing it keeps the three former copies in sync.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existing) return existing as Profile;

  const seed = user.id;
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: deriveDisplayName(user),
      avatar_type: 'dicebear',
      dicebear_style: DEFAULT_DICEBEAR_STYLE,
      dicebear_seed: seed,
      avatar_url: generateDicebearDataUri(DEFAULT_DICEBEAR_STYLE, seed),
    })
    .select()
    .single();

  if (error) return null;
  return (created as Profile) ?? null;
}
