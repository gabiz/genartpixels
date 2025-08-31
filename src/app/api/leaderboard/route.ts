/**
 * API route for leaderboard data
 * GET /api/leaderboard?type=frames&period=week&limit=10
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { APIResponse, APIError } from '@/lib/types'

interface LeaderboardFrame {
  id: string
  handle: string
  title: string
  owner_handle: string
  contributors_count: number
  total_pixels: number
  likes_count: number
  last_activity: string
  created_at: string
  rank: number
}

interface LeaderboardUser {
  handle: string
  frames_created: number
  frames_contributed_to: number
  total_pixels_placed: number
  frames_liked: number
  rank: number
}

type LeaderboardType = 'frames' | 'users'
type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all'

interface LeaderboardResponse {
  type: LeaderboardType
  period: LeaderboardPeriod
  frames?: LeaderboardFrame[]
  users?: LeaderboardUser[]
  total: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const type = (searchParams.get('type') || 'frames') as LeaderboardType
    const period = (searchParams.get('period') || 'week') as LeaderboardPeriod
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100)

    if (!['frames', 'users'].includes(type)) {
      return NextResponse.json<APIError>({
        error: 'Invalid leaderboard type. Must be "frames" or "users"',
        code: 'INVALID_INPUT',
        success: false
      }, { status: 400 })
    }

    if (!['day', 'week', 'month', 'all'].includes(period)) {
      return NextResponse.json<APIError>({
        error: 'Invalid period. Must be "day", "week", "month", or "all"',
        code: 'INVALID_INPUT',
        success: false
      }, { status: 400 })
    }

    // Calculate date filter based on period
    let dateFilter = ''
    const now = new Date()
    
    switch (period) {
      case 'day':
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        dateFilter = dayAgo.toISOString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = weekAgo.toISOString()
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = monthAgo.toISOString()
        break
      case 'all':
        dateFilter = ''
        break
    }

    if (type === 'frames') {
      // Get top frames leaderboard
      let query = supabase
        .from('frame_details')
        .select(`
          id,
          handle,
          title,
          owner_handle,
          contributors_count,
          total_pixels,
          likes_count,
          last_activity,
          created_at
        `)

      // Apply date filter if specified
      if (dateFilter) {
        query = query.gte('last_activity', dateFilter)
      }

      // Order by different metrics based on what makes sense
      // For recent periods, prioritize activity; for all-time, prioritize likes
      const orderBy = period === 'all' ? 'likes_count' : 'total_pixels'
      
      const { data: frames, error: framesError } = await query
        .order(orderBy, { ascending: false })
        .order('contributors_count', { ascending: false })
        .limit(limit)

      if (framesError) {
        return NextResponse.json<APIError>({
          error: 'Failed to fetch frames leaderboard',
          code: 'DATABASE_ERROR',
          success: false
        }, { status: 500 })
      }

      const framesWithRank: LeaderboardFrame[] = (frames || []).map((frame, index) => ({
        ...frame,
        rank: index + 1
      }))

      return NextResponse.json<APIResponse<LeaderboardResponse>>({
        data: {
          type: 'frames',
          period,
          frames: framesWithRank,
          total: framesWithRank.length
        },
        success: true
      })

    } else {
      // Get top users leaderboard
      // This is more complex as we need to aggregate user stats
      let pixelQuery = supabase
        .from('pixels')
        .select('contributor_handle')

      if (dateFilter) {
        pixelQuery = pixelQuery.gte('placed_at', dateFilter)
      }

      // Get user statistics
      const { data: userStats, error: statsError } = await supabase
        .rpc('get_user_leaderboard', {
          period_filter: dateFilter || null,
          result_limit: limit
        })

      if (statsError) {
        // If the RPC doesn't exist, fall back to a simpler query
        console.warn('RPC get_user_leaderboard not found, using fallback query')
        
        // Fallback: get basic user stats from the user_stats view
        const { data: fallbackStats, error: fallbackError } = await supabase
          .from('user_stats')
          .select('*')
          .order('total_pixels_placed', { ascending: false })
          .limit(limit)

        if (fallbackError) {
          return NextResponse.json<APIError>({
            error: 'Failed to fetch users leaderboard',
            code: 'DATABASE_ERROR',
            success: false
          }, { status: 500 })
        }

        const usersWithRank: LeaderboardUser[] = (fallbackStats || []).map((user, index) => ({
          handle: user.handle,
          frames_created: user.frames_created || 0,
          frames_contributed_to: user.frames_contributed_to || 0,
          total_pixels_placed: user.total_pixels_placed || 0,
          frames_liked: user.frames_liked || 0,
          rank: index + 1
        }))

        return NextResponse.json<APIResponse<LeaderboardResponse>>({
          data: {
            type: 'users',
            period,
            users: usersWithRank,
            total: usersWithRank.length
          },
          success: true
        })
      }

      const usersWithRank: LeaderboardUser[] = (userStats || []).map((user: any, index: number) => ({
        handle: user.handle,
        frames_created: user.frames_created || 0,
        frames_contributed_to: user.frames_contributed_to || 0,
        total_pixels_placed: user.total_pixels_placed || 0,
        frames_liked: user.frames_liked || 0,
        rank: index + 1
      }))

      return NextResponse.json<APIResponse<LeaderboardResponse>>({
        data: {
          type: 'users',
          period,
          users: usersWithRank,
          total: usersWithRank.length
        },
        success: true
      })
    }

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json<APIError>({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      success: false
    }, { status: 500 })
  }
}