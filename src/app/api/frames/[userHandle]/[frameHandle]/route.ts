/**
 * API route for individual frame operations
 * GET /api/frames/[userHandle]/[frameHandle] - Get specific frame with pixel data
 * PUT /api/frames/[userHandle]/[frameHandle] - Update frame (owner only)
 * DELETE /api/frames/[userHandle]/[frameHandle] - Delete frame (owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'
import {
  validateFrameTitle,
  validateFrameDescription,
  validateFrameKeywords,
  validateFramePermissions,
  sanitizeString,
  VALIDATION_MESSAGES
} from '@/lib/validation'
import type {
  FrameResponse,
  APIResponse,
  APIError,
  FrameWithStats,
  FramePermission,
  FramePermissionType,
  Pixel
} from '@/lib/types'

interface RouteParams {
  params: Promise<{
    userHandle: string
    frameHandle: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()
    const { userHandle, frameHandle } = await params

    // Get the current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()
    let currentUserHandle: string | null = null

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('handle')
        .eq('id', user.id)
        .single()
      
      currentUserHandle = userData?.handle || null
    }

    // Get frame with stats
    const { data: frameData, error: frameError } = await supabase
      .from('frame_details')
      .select('*')
      .eq('owner_handle', userHandle)
      .eq('handle', frameHandle)
      .single()

    if (frameError || !frameData) {
      return NextResponse.json(
        { success: false, error: 'Frame not found', code: 'FRAME_NOT_FOUND' } as APIError,
        { status: 404 }
      )
    }

    // Transform to FrameWithStats
    const frame: FrameWithStats = {
      id: frameData.id!,
      handle: frameData.handle!,
      title: frameData.title!,
      description: frameData.description,
      keywords: frameData.keywords || [],
      owner_handle: frameData.owner_handle!,
      width: frameData.width!,
      height: frameData.height!,
      permissions: frameData.permissions || 'open',
      is_frozen: frameData.is_frozen || false,
      created_at: frameData.created_at,
      updated_at: frameData.updated_at,
      stats: {
        frame_id: frameData.id!,
        contributors_count: frameData.contributors_count || 0,
        total_pixels: frameData.total_pixels || 0,
        likes_count: frameData.likes_count || 0,
        last_activity: frameData.last_activity,
        updated_at: frameData.updated_at
      }
    }

    // Check user permissions for this frame
    let userPermission: FramePermission | null = null
    if (currentUserHandle) {
      const { data: permissionData } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', frame.id)
        .eq('user_handle', currentUserHandle)
        .single()
      
      userPermission = permissionData || null
    }

    // Check if user can view this frame
    const canView = checkFrameViewPermission(frame, currentUserHandle, userPermission)
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Permission denied', code: 'PERMISSION_DENIED' } as APIError,
        { status: 403 }
      )
    }

    // Get latest snapshot
    const { data: snapshotData } = await supabase
      .from('frame_snapshots')
      .select('*')
      .eq('frame_id', frame.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let snapshotBuffer = new Uint8Array(0)
    let snapshotCreatedAt = new Date(0).toISOString()

    if (snapshotData) {
      // Convert base64 snapshot data to Uint8Array
      snapshotBuffer = new Uint8Array(Buffer.from(snapshotData.snapshot_data, 'base64'))
      snapshotCreatedAt = snapshotData.created_at || new Date(0).toISOString()
    }

    // Get recent pixels since last snapshot
    // const { data: recentPixels, error: pixelsError } = await supabase
    //   .from('pixels')
    //   .select('*')
    //   .eq('frame_id', frame.id)
    //   .order('placed_at', { ascending: true })
    //   .range(0, 1999)

    const pageSize = 1000
    let from = 0
    let to = pageSize - 1
    let all: Pixel[] = []
    let done = false
    // let pixelsError = null
    // let recentPixels: any[] = []

    while (!done) {
      const { data: recentPixels, error: pixelsError } = await supabase
        .from('pixels')
        .select('*')
        .eq('frame_id', frame.id)
        .order('placed_at', { ascending: true })
        .range(from, to);

      if (pixelsError) break;

      all = all.concat(recentPixels);

      if (recentPixels.length < pageSize) {
        done = true; // last page
      } else {
        from += pageSize;
        to += pageSize;
      }

      if (pixelsError) {
        console.error('Error fetching recent pixels:', pixelsError)
        return NextResponse.json(
          { success: false, error: 'Failed to load frame data', code: 'DATABASE_ERROR' } as APIError,
          { status: 500 }
        )
      }
    }


    const response: APIResponse<FrameResponse> = {
      success: true,
      data: {
        frame,
        snapshotData: snapshotBuffer,
        recentPixels: all || [],
        userPermission
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in frame GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()
    const { userHandle, frameHandle } = await params

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' } as APIError,
        { status: 401 }
      )
    }

    // Get user's handle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('handle')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' } as APIError,
        { status: 404 }
      )
    }

    // Get the frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select('*')
      .eq('owner_handle', userHandle)
      .eq('handle', frameHandle)
      .single()

    if (frameError || !frame) {
      return NextResponse.json(
        { success: false, error: 'Frame not found', code: 'FRAME_NOT_FOUND' } as APIError,
        { status: 404 }
      )
    }

    // Check if user is the owner
    if (frame.owner_handle !== userData.handle) {
      return NextResponse.json(
        { success: false, error: 'Only frame owner can update frame', code: 'PERMISSION_DENIED' } as APIError,
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    // Validate and sanitize each field if provided
    if (body.title !== undefined) {
      if (!validateFrameTitle(body.title)) {
        return NextResponse.json(
          { success: false, error: VALIDATION_MESSAGES.INVALID_TITLE, code: 'INVALID_TITLE' } as APIError,
          { status: 400 }
        )
      }
      updates.title = sanitizeString(body.title, 255)
    }

    if (body.description !== undefined) {
      if (!validateFrameDescription(body.description)) {
        return NextResponse.json(
          { success: false, error: VALIDATION_MESSAGES.INVALID_DESCRIPTION, code: 'INVALID_DESCRIPTION' } as APIError,
          { status: 400 }
        )
      }
      updates.description = sanitizeString(body.description, 1000)
    }

    if (body.keywords !== undefined) {
      if (!validateFrameKeywords(body.keywords)) {
        return NextResponse.json(
          { success: false, error: VALIDATION_MESSAGES.INVALID_KEYWORDS, code: 'INVALID_KEYWORDS' } as APIError,
          { status: 400 }
        )
      }
      updates.keywords = body.keywords.map((keyword: string) => sanitizeString(keyword, 50)).filter((k: string) => k.length > 0)
    }

    if (body.permissions !== undefined) {
      if (!validateFramePermissions(body.permissions)) {
        return NextResponse.json(
          { success: false, error: VALIDATION_MESSAGES.INVALID_PERMISSIONS, code: 'INVALID_PERMISSIONS' } as APIError,
          { status: 400 }
        )
      }
      updates.permissions = body.permissions as FramePermissionType
    }

    if (body.is_frozen !== undefined) {
      updates.is_frozen = Boolean(body.is_frozen)
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Update the frame
    const { data: updatedFrame, error: updateError } = await supabase
      .from('frames')
      .update(updates)
      .eq('id', frame.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating frame:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update frame', code: 'UPDATE_FAILED' } as APIError,
        { status: 500 }
      )
    }

    const response: APIResponse<typeof updatedFrame> = {
      success: true,
      data: updatedFrame
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in frame PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()
    const { userHandle, frameHandle } = await params

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' } as APIError,
        { status: 401 }
      )
    }

    // Get user's handle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('handle')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' } as APIError,
        { status: 404 }
      )
    }

    // Get the frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select('*')
      .eq('owner_handle', userHandle)
      .eq('handle', frameHandle)
      .single()

    if (frameError || !frame) {
      return NextResponse.json(
        { success: false, error: 'Frame not found', code: 'FRAME_NOT_FOUND' } as APIError,
        { status: 404 }
      )
    }

    // Check if user is the owner
    if (frame.owner_handle !== userData.handle) {
      return NextResponse.json(
        { success: false, error: 'Only frame owner can delete frame', code: 'PERMISSION_DENIED' } as APIError,
        { status: 403 }
      )
    }

    // Delete the frame (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('frames')
      .delete()
      .eq('id', frame.id)

    if (deleteError) {
      console.error('Error deleting frame:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete frame', code: 'DELETE_FAILED' } as APIError,
        { status: 500 }
      )
    }

    const response: APIResponse<{ deleted: true }> = {
      success: true,
      data: { deleted: true }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in frame DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}

/**
 * Check if user can view a frame based on permissions
 */
function checkFrameViewPermission(
  frame: FrameWithStats,
  userHandle: string | null,
  userPermission: FramePermission | null
): boolean {
  // Owner can always view
  if (userHandle === frame.owner_handle) {
    return true
  }

  // Check frame permissions
  switch (frame.permissions) {
    case 'open':
      // Anyone can view open frames
      return true
    
    case 'approval-required':
      // Need to be approved contributor or owner
      return userPermission?.permission_type === 'contributor'
    
    case 'owner-only':
      // Only owner can view
      return userHandle === frame.owner_handle
    
    default:
      return false
  }
}