import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkGeneralLimit } from '@/lib/rate-limit';

export async function updateSession(request: NextRequest) {
  // General per-IP throttle for the server itself (basic abuse/DoS
  // protection). No-ops safely if Upstash isn't configured. Note: this only
  // covers requests to THIS Next.js server — board/note writes and Supabase
  // auth calls go directly from the browser to Supabase and aren't covered
  // (see SECURITY.md).
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success } = await checkGeneralLimit(ip);
  if (!success) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedRoutes = ['/stories', '/settings', '/board'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/stories';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
