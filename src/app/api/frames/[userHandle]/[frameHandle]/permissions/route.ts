/**
 * API routes for frame permission management
 * GET /api/frames/[userHandle]/[frameHandle]/permissions - List frame permissions
 * POST /api/frames/[userHandle]/[frameHandle]/permissions - Grant/update permissions
 * DELETE /api/frames/[userHandle]/[frameHandle]/permissions - Remove permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'
import { validateHandle, VALIDATION_MESSAGES } from '@/lib/validation'
import type {
  APIResponse,
  APIError,
  FramePermission,
  UserPermissionType
} from '@/lib/types'

interface RouteParams {
  params: Promise<{
    userHandle: string
    frameHandle: string
  }>
}

interface PermissionRequest {
  targetUserHandle: string
  permissionType: UserPermissionType
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Only frame owner can view permissions', code: 'PERMISSION_DENIED' } as APIError,
        { status: 403 }
      )
    }

    // Get all permissions for this frame
    const { data: permissions, error: permissionsError } = await supabase
      .from('frame_permissions')
      .select('*')
      .eq('frame_id', frame.id)
      .order('created_at', { ascending: false })

    if (permissionsError) {
      console.error('Error fetching frame permissions:', permissionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch permissions', code: 'DATABASE_ERROR' } as APIError,
        { status: 500 }
      )
    }

    const response: APIResponse<FramePermission[]> = {
      success: true,
      data: permissions || []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in permissions GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Only frame owner can manage permissions', code: 'PERMISSION_DENIED' } as APIError,
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body: PermissionRequest = await request.json()
    const { targetUserHandle, permissionType } = body

    // Validate inputs
    if (!validateHandle(targetUserHandle)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_HANDLE, code: 'INVALID_HANDLE' } as APIError,
        { status: 400 }
      )
    }

    const validPermissionTypes: UserPermissionType[] = ['contributor', 'blocked', 'pending']
    if (!validPermissionTypes.includes(permissionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid permission type', code: 'INVALID_PERMISSION_TYPE' } as APIError,
        { status: 400 }
      )
    }

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('handle')
      .eq('handle', targetUserHandle)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Target user not found', code: 'USER_NOT_FOUND' } as APIError,
        { status: 404 }
      )
    }

    // Cannot set permissions for frame owner
    if (targetUserHandle === frame.owner_handle) {
      return NextResponse.json(
        { success: false, error: 'Cannot set permissions for frame owner', code: 'INVALID_TARGET' } as APIError,
        { status: 400 }
      )
    }

    // Upsert permission (insert or update if exists)
    const { data: permission, error: permissionError } = await supabase
      .from('frame_permissions')
      .upsert({
        frame_id: frame.id,
        user_handle: targetUserHandle,
        permission_type: permissionType,
        granted_by: userData.handle
      }, {
        onConflict: 'frame_id,user_handle'
      })
      .select()
      .single()

    if (permissionError) {
      console.error('Error setting frame permission:', permissionError)
      return NextResponse.json(
        { success: false, error: 'Failed to set permission', code: 'DATABASE_ERROR' } as APIError,
        { status: 500 }
      )
    }

    const response: APIResponse<FramePermission> = {
      success: true,
      data: permission
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in permissions POST:', error)
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
        { success: false, error: 'Only frame owner can manage permissions', code: 'PERMISSION_DENIED' } as APIError,
        { status: 403 }
      )
    }

    // Get target user handle from query params
    const { searchParams } = new URL(request.url)
    const targetUserHandle = searchParams.get('userHandle')

    if (!targetUserHandle || !validateHandle(targetUserHandle)) {
      return NextResponse.json(
        { success: false, error: 'Valid target user handle required', code: 'INVALID_HANDLE' } as APIError,
        { status: 400 }
      )
    }

    // Cannot remove permissions for frame owner
    if (targetUserHandle === frame.owner_handle) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove permissions for frame owner', code: 'INVALID_TARGET' } as APIError,
        { status: 400 }
      )
    }

    // Delete the permission
    const { error: deleteError } = await supabase
      .from('frame_permissions')
      .delete()
      .eq('frame_id', frame.id)
      .eq('user_handle', targetUserHandle)

    if (deleteError) {
      console.error('Error deleting frame permission:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to remove permission', code: 'DATABASE_ERROR' } as APIError,
        { status: 500 }
      )
    }

    const response: APIResponse<{ deleted: true }> = {
      success: true,
      data: { deleted: true }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in permissions DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}