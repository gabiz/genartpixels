/**
 * API route for creating user handles after SSO authentication
 * POST /api/auth/create-handle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validateHandle, VALIDATION_MESSAGES } from '@/lib/validation'
import type { HandleCreationRequest, HandleCreationResponse } from '@/lib/auth/types'
import { createServer } from 'http'

export async function POST(request: NextRequest) {
  console.log("create handle called")
  try {
    // Create Supabase client that can read cookies for auth
    // const cookieStore = await cookies()
    // const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const supabase = await createServerClient()
    
    // Create service role client for database operations (bypasses RLS)
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Try to get session from cookies first
    let { data: { session }, error: sessionError } = await supabase.auth.getSession()
    let user = session?.user

    // If no session from cookies, try Authorization header
    if (!session || !user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
        if (!tokenError && tokenUser) {
          user = tokenUser
          session = { access_token: token, user: tokenUser } as any
        }
      }
    }

    if (!user) {
      console.error('Authentication failed - no user found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: HandleCreationRequest = await request.json()
    const { handle } = body

    // Validate handle format
    if (!validateHandle(handle)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_HANDLE },
        { status: 400 }
      )
    }

    // Check if user already has a handle (using admin client to bypass RLS)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, handle')
      .eq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already has a handle' },
        { status: 400 }
      )
    }

    // Check if handle is already taken (using admin client to bypass RLS)
    const { data: handleCheck, error: handleError } = await supabaseAdmin
      .from('users')
      .select('handle')
      .eq('handle', handle)
      .single()

    if (handleError && handleError.code !== 'PGRST116') {
      console.error('Error checking handle availability:', handleError)
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (handleCheck) {
      return NextResponse.json(
        { success: false, error: 'Handle is already taken' },
        { status: 400 }
      )
    }

    // Create user record with handle (using admin client to bypass RLS)

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        handle: handle,
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        pixels_available: 100,
        last_refill: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      
      // Handle unique constraint violations
      if (createError.code === '23505') {
        if (createError.message.includes('handle')) {
          return NextResponse.json(
            { success: false, error: 'Handle is already taken' },
            { status: 400 }
          )
        }
        if (createError.message.includes('email')) {
          return NextResponse.json(
            { success: false, error: 'Email is already registered' },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    const response: HandleCreationResponse = {
      success: true,
      user: newUser,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in create-handle:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}