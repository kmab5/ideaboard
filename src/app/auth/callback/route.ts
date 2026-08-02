import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/navigation';
import { ensureProfile } from '@/lib/profile';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Only allow safe, same-origin relative redirects (prevents open redirect).
  const next = sanitizeRedirectPath(searchParams.get('next'), '/stories');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure a profile exists (backup for when the DB trigger doesn't fire).
      await ensureProfile(supabase, data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
