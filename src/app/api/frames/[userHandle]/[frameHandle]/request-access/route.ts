/**
 * API route for requesting access to approval-required frames
 * POST /api/frames/[userHandle]/[frameHandle]/request-access - Request edit permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'
import type {
    APIResponse,
    APIError,
    FramePermission
} from '@/lib/types'

interface RouteParams {
    params: Promise<{
        userHandle: string
        frameHandle: string
    }>
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

        // Check if frame allows permission requests
        if (frame.permissions !== 'approval-required') {
            return NextResponse.json(
                { success: false, error: 'Frame does not require approval for access', code: 'INVALID_FRAME_TYPE' } as APIError,
                { status: 400 }
            )
        }

        // Cannot request access to own frame
        if (frame.owner_handle === userData.handle) {
            return NextResponse.json(
                { success: false, error: 'Cannot request access to own frame', code: 'INVALID_REQUEST' } as APIError,
                { status: 400 }
            )
        }

        // Check if user already has a permission record
        const { data: existingPermission, error: checkError } = await supabase
            .from('frame_permissions')
            .select('*')
            .eq('frame_id', frame.id)
            .eq('user_handle', userData.handle)
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing permission:', checkError)
            return NextResponse.json(
                { success: false, error: 'Database error occurred', code: 'DATABASE_ERROR' } as APIError,
                { status: 500 }
            )
        }

        // If user already has permission, return appropriate response
        if (existingPermission) {
            switch (existingPermission.permission_type) {
                case 'contributor':
                    return NextResponse.json(
                        { success: false, error: 'User already has contributor access', code: 'ALREADY_CONTRIBUTOR' } as APIError,
                        { status: 400 }
                    )
                case 'blocked':
                    return NextResponse.json(
                        { success: false, error: 'User is blocked from this frame', code: 'USER_BLOCKED' } as APIError,
                        { status: 403 }
                    )
                case 'pending':
                    return NextResponse.json(
                        { success: false, error: 'Access request already pending', code: 'REQUEST_PENDING' } as APIError,
                        { status: 400 }
                    )
            }
        }

        // Create pending permission request
        const { data: permission, error: permissionError } = await supabase
            .from('frame_permissions')
            .insert({
                frame_id: frame.id,
                user_handle: userData.handle,
                permission_type: 'pending',
                granted_by: frame.owner_handle // Set to owner, they will approve/deny
            })
            .select()
            .single()

        if (permissionError) {
            console.error('Error creating permission request:', permissionError)
            return NextResponse.json(
                { success: false, error: 'Failed to create access request', code: 'DATABASE_ERROR' } as APIError,
                { status: 500 }
            )
        }

        const response: APIResponse<FramePermission> = {
            success: true,
            data: permission
        }

        return NextResponse.json(response, { status: 201 })
    } catch (error) {
        console.error('Unexpected error in request-access POST:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
            { status: 500 }
        )
    }
}