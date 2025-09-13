/**
 * OAuth callback handler for Supabase Auth
 * Handles the redirect after successful OAuth authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import { type NextApiRequest, type NextApiResponse } from 'next'

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              console.log("cookie ", name, value)
            }
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? searchParams.get('redirect') ?? '/'

  console.log("auth/callback called", code, next)
  const origin = process.env.NEXT_PUBLIC_APP_URL

  if (code) {
    try {
      // Create server-side Supabase client that can set cookies
      const supabase = await createClient()
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log("data ", data)
      
      if (!error) {
        // Successful authentication - redirect to the intended page or home
        const redirectUrl = new URL(next, origin)
        // Add a timestamp to force a fresh page load and avoid WebSocket issues
        redirectUrl.searchParams.set('auth_success', Date.now().toString())
        return NextResponse.redirect(redirectUrl.toString())
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // If there was an error, redirect to home with error parameter
  return NextResponse.redirect(`${origin}/?error=auth_error`)
}