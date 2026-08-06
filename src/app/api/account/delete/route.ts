import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { checkAccountDeleteLimit } from '@/lib/rate-limit';

/**
 * Permanently delete the signed-in user's account.
 *
 * Security notes:
 * - The target user is taken from the verified session, never from the request
 *   body, so this endpoint cannot be used to delete someone else's account.
 * - The service-role key is read at request time and never leaves the server.
 * - Deleting the auth user cascades through profiles → stories → boards →
 *   notes/connections/components via ON DELETE CASCADE.
 */
export async function POST(request: Request) {
  // CSRF defense in depth. Supabase's auth cookies are SameSite=Lax, which
  // already blocks cross-site POSTs, but this endpoint is destructive so we
  // also require the request to originate from our own origin.
  const origin = request.headers.get('origin');
  if (origin) {
    const host = request.headers.get('host');
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || originHost !== host) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Keyed by user id (not IP): this is a rare, deliberate, destructive action,
  // so a handful per hour is generous for a real user and blocks scripted abuse.
  const { success } = await checkAccountDeleteLimit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many deletion attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('Account deletion attempted without SUPABASE_SERVICE_ROLE_KEY configured');
    return NextResponse.json(
      { error: 'Account deletion is not configured on this deployment' },
      { status: 503 }
    );
  }

  const admin = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Best-effort cleanup of storage objects, which are not covered by the
  // database cascade. Failures here must not block account deletion.
  for (const bucket of ['avatars', 'note-attachments', 'attachments', 'thumbnails']) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
      if (files?.length) {
        await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
      }
    } catch (error) {
      console.error(`Failed to clear ${bucket} for deleted user:`, error);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('Failed to delete user:', deleteError);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }

  // Clear the session cookies for this browser.
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
