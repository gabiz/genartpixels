/**
 * API route for creating user handles after SSO authentication
 * POST /api/auth/create-handle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validateHandle, VALIDATION_MESSAGES } from '@/lib/validation'
import type { HandleCreationRequest, HandleCreationResponse } from '@/lib/auth/types'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client that can read cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Check if user already has a handle
    const { data: existingUser, error: checkError } = await supabase
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

    // Check if handle is already taken
    const { data: handleCheck, error: handleError } = await supabase
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

    // Create user record with handle
    const { data: newUser, error: createError } = await supabase
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