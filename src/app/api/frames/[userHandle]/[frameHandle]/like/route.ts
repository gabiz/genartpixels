/**
 * API route for frame like/unlike functionality
 * POST /api/frames/[userHandle]/[frameHandle]/like - Toggle like status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { APIResponse, APIError, ERROR_CODES } from '@/lib/types'

interface LikeResponse {
  liked: boolean
  likesCount: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userHandle: string; frameHandle: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<APIError>({
        error: 'Authentication required',
        code: ERROR_CODES.PERMISSION_DENIED,
        success: false
      }, { status: 401 })
    }

    // Get user handle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('handle')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json<APIError>({
        error: 'User not found',
        code: ERROR_CODES.PERMISSION_DENIED,
        success: false
      }, { status: 404 })
    }

    const userHandle = userData.handle

    // Get frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select('id')
      .eq('owner_handle', params.userHandle)
      .eq('handle', params.frameHandle)
      .single()

    if (frameError || !frame) {
      return NextResponse.json<APIError>({
        error: 'Frame not found',
        code: ERROR_CODES.FRAME_NOT_FOUND,
        success: false
      }, { status: 404 })
    }

    // Check if user already liked this frame
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('frame_likes')
      .select('id')
      .eq('frame_id', frame.id)
      .eq('user_handle', userHandle)
      .single()

    let liked = false

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('frame_likes')
        .delete()
        .eq('frame_id', frame.id)
        .eq('user_handle', userHandle)

      if (deleteError) {
        return NextResponse.json<APIError>({
          error: 'Failed to unlike frame',
          code: 'UNLIKE_FAILED',
          success: false
        }, { status: 500 })
      }

      liked = false
    } else {
      // Like - add the like
      const { error: insertError } = await supabase
        .from('frame_likes')
        .insert({
          frame_id: frame.id,
          user_handle: userHandle
        })

      if (insertError) {
        return NextResponse.json<APIError>({
          error: 'Failed to like frame',
          code: 'LIKE_FAILED',
          success: false
        }, { status: 500 })
      }

      liked = true
    }

    // Get updated likes count
    const { data: stats, error: statsError } = await supabase
      .from('frame_stats')
      .select('likes_count')
      .eq('frame_id', frame.id)
      .single()

    const likesCount = stats?.likes_count || 0

    return NextResponse.json<APIResponse<LikeResponse>>({
      data: {
        liked,
        likesCount
      },
      success: true
    })

  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json<APIError>({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      success: false
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userHandle: string; frameHandle: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user (optional for GET)
    const { data: { user } } = await supabase.auth.getUser()
    let userHandle: string | null = null

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('handle')
        .eq('id', user.id)
        .single()
      
      userHandle = userData?.handle || null
    }

    // Get frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select('id')
      .eq('owner_handle', params.userHandle)
      .eq('handle', params.frameHandle)
      .single()

    if (frameError || !frame) {
      return NextResponse.json<APIError>({
        error: 'Frame not found',
        code: ERROR_CODES.FRAME_NOT_FOUND,
        success: false
      }, { status: 404 })
    }

    // Check if current user liked this frame
    let liked = false
    if (userHandle) {
      const { data: existingLike } = await supabase
        .from('frame_likes')
        .select('id')
        .eq('frame_id', frame.id)
        .eq('user_handle', userHandle)
        .single()

      liked = !!existingLike
    }

    // Get likes count
    const { data: stats } = await supabase
      .from('frame_stats')
      .select('likes_count')
      .eq('frame_id', frame.id)
      .single()

    const likesCount = stats?.likes_count || 0

    return NextResponse.json<APIResponse<LikeResponse>>({
      data: {
        liked,
        likesCount
      },
      success: true
    })

  } catch (error) {
    console.error('Like status error:', error)
    return NextResponse.json<APIError>({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      success: false
    }, { status: 500 })
  }
}