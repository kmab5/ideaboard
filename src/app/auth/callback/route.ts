import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/stories';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // If no profile, create one (backup for when trigger doesn't fire)
      if (!profile) {
        const displayName =
          data.user.user_metadata?.display_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'User';

        const seed = data.user.id;
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

        await supabase.from('profiles').insert({
          id: data.user.id,
          display_name: displayName,
          avatar_type: 'dicebear',
          dicebear_style: 'adventurer',
          dicebear_seed: seed,
          avatar_url: avatarUrl,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
