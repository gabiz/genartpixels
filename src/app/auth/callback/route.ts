/**
 * OAuth callback handler for Supabase Auth
 * Handles the redirect after successful OAuth authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? searchParams.get('redirect') ?? '/'



  if (code) {
    try {
      // Create server-side Supabase client that can set cookies
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      

      
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