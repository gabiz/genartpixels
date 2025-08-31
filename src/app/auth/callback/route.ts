/**
 * OAuth callback handler for Supabase Auth
 * Handles the redirect after successful OAuth authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication - redirect to the intended page or home
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // If there was an error, redirect to home with error parameter
  return NextResponse.redirect(`${origin}/?error=auth_error`)
}