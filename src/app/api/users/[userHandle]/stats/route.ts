/**
 * API route for fetching user statistics
 * GET /api/users/[userHandle]/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface UserStats {
  handle: string
  created_at: string
  frames_created: number
  frames_contributed_to: number
  total_pixels_placed: number
  frames_liked: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userHandle: string } }
) {
  try {
    const { userHandle } = params

    // Validate handle format
    if (!/^[a-zA-Z0-9_-]{5,20}$/.test(userHandle)) {
      return NextResponse.json(
        { error: 'Invalid handle format' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('handle, created_at')
      .eq('handle', userHandle)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user statistics using the user_stats view
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('handle', userHandle)
      .single()

    if (statsError) {
      console.error('Error fetching user stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      )
    }

    const userStats: UserStats = {
      handle: user.handle,
      created_at: user.created_at,
      frames_created: stats?.frames_created || 0,
      frames_contributed_to: stats?.frames_contributed_to || 0,
      total_pixels_placed: stats?.total_pixels_placed || 0,
      frames_liked: stats?.frames_liked || 0,
    }

    return NextResponse.json(userStats)
  } catch (error) {
    console.error('Unexpected error in user stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}