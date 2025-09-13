/**
 * Pixel placement API endpoint
 * Handles pixel placement with quota validation and conflict resolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'
import { cookies } from 'next/headers'
import { validateCoordinates, validateColor } from '@/lib/validation'
import { 
  PlacePixelRequest, 
  PlacePixelResponse, 
  ERROR_CODES, 
  VALIDATION_CONSTRAINTS,
  QuotaExceededError,
  ValidationError
} from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required', 
          code: ERROR_CODES.PERMISSION_DENIED 
        },
        { status: 401 }
      )
    }

    // Get user's handle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('handle, pixels_available, last_refill')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found', 
          code: ERROR_CODES.PERMISSION_DENIED 
        },
        { status: 404 }
      )
    }

    // Parse request body
    const body: PlacePixelRequest = await request.json()
    const { frameId, x, y, color } = body
    console.log("userData:", userData)
    console.log("frameId:", frameId)
    console.log("x:", x, " y:", y)
    console.log("color:", color)

    // Validate input
    if (!frameId || typeof frameId !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Frame ID is required', 
          code: ERROR_CODES.FRAME_NOT_FOUND 
        },
        { status: 400 }
      )
    }

    if (!validateColor(color)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid color value', 
          code: ERROR_CODES.INVALID_COLOR 
        },
        { status: 400 }
      )
    }

    // Get frame information
    const { data: frameData, error: frameError } = await supabase
      .from('frames')
      .select('id, width, height, is_frozen, permissions, owner_handle')
      .eq('id', frameId)
      .single()

    if (frameError || !frameData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Frame not found', 
          code: ERROR_CODES.FRAME_NOT_FOUND 
        },
        { status: 404 }
      )
    }

    // Validate coordinates
    if (!validateCoordinates(x, y, frameData.width, frameData.height)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid coordinates', 
          code: ERROR_CODES.INVALID_COORDINATES 
        },
        { status: 400 }
      )
    }

    // Check if frame is frozen
    if (frameData.is_frozen) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Frame is frozen', 
          code: ERROR_CODES.FRAME_FROZEN 
        },
        { status: 403 }
      )
    }

    // Check permissions
    const hasPermission = await checkUserPermission(
      supabase, 
      frameId, 
      userData.handle, 
      frameData.permissions, 
      frameData.owner_handle
    )

    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Permission denied', 
          code: ERROR_CODES.PERMISSION_DENIED 
        },
        { status: 403 }
      )
    }

    // Check if pixel already exists and if it's the same color
    const { data: existingPixel } = await supabase
      .from('pixels')
      .select('color')
      .eq('frame_id', frameId)
      .eq('x', x)
      .eq('y', y)
      .single()

    // If pixel exists with same color, no need to place it again
    if (existingPixel && existingPixel.color === color) {
      return NextResponse.json({
        success: true,
        quotaRemaining: userData.pixels_available
      })
    }

    // Update user quota (refill if needed)
    const updatedQuota = await updateUserQuota(supabase, userData)

    // Check if user has available pixels
    if (updatedQuota <= 0) {
      const nextRefillTime = new Date(userData.last_refill)
      nextRefillTime.setHours(nextRefillTime.getHours() + 1)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pixel quota exceeded', 
          code: ERROR_CODES.QUOTA_EXCEEDED,
          details: { nextRefillTime: nextRefillTime.toISOString() }
        },
        { status: 429 }
      )
    }

    // Place the pixel (upsert to handle conflicts)
    const { data: pixelData, error: pixelError } = await supabase
      .from('pixels')
      .upsert({
        frame_id: frameId,
        x,
        y,
        color,
        contributor_handle: userData.handle,
        placed_at: new Date().toISOString()
      }, {
        onConflict: 'frame_id,x,y'
      })
      .select()
      .single()

    if (pixelError) {
      console.error('Error placing pixel:', pixelError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to place pixel', 
          code: 'DATABASE_ERROR' 
        },
        { status: 500 }
      )
    }

    // Decrement user quota
    const { error: quotaError } = await supabase
      .from('users')
      .update({ 
        pixels_available: updatedQuota - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (quotaError) {
      console.error('Error updating quota:', quotaError)
      // Note: Pixel was placed but quota wasn't decremented
      // This is acceptable as it favors the user
    }

    const response: PlacePixelResponse = {
      success: true,
      pixel: pixelData,
      quotaRemaining: updatedQuota - 1
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Pixel placement error:', error)
    
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message, 
          code: ERROR_CODES.QUOTA_EXCEEDED,
          details: { remainingTime: error.remainingTime }
        },
        { status: 429 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message, 
          code: ERROR_CODES.INVALID_COORDINATES 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
}

/**
 * Check if user has permission to place pixels on the frame
 */
async function checkUserPermission(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  frameId: string,
  userHandle: string,
  framePermissions: string,
  ownerHandle: string
): Promise<boolean> {
  // Owner always has permission
  if (userHandle === ownerHandle) {
    return true
  }

  // Open frames allow everyone
  if (framePermissions === 'open') {
    // Check if user is not blocked
    const { data: permission } = await supabase
      .from('frame_permissions')
      .select('permission_type')
      .eq('frame_id', frameId)
      .eq('user_handle', userHandle)
      .single()

    return !permission || permission.permission_type !== 'blocked'
  }

  // Approval-required and owner-only frames need explicit permission
  if (framePermissions === 'approval-required' || framePermissions === 'owner-only') {
    const { data: permission } = await supabase
      .from('frame_permissions')
      .select('permission_type')
      .eq('frame_id', frameId)
      .eq('user_handle', userHandle)
      .single()

    return permission?.permission_type === 'contributor'
  }

  return false
}

/**
 * Update user quota with hourly refill logic
 */
async function updateUserQuota(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any
): Promise<number> {
  const now = new Date()
  const lastRefill = new Date(userData.last_refill)
  const hoursSinceRefill = Math.floor((now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60))

  if (hoursSinceRefill >= 1) {
    // Calculate new quota (max 100)
    const refillAmount = hoursSinceRefill * VALIDATION_CONSTRAINTS.PIXELS.MAX_PER_HOUR
    const newQuota = Math.min(
      userData.pixels_available + refillAmount,
      VALIDATION_CONSTRAINTS.PIXELS.MAX_PER_HOUR
    )

    // Update user's quota and last refill time
    const { error } = await supabase
      .from('users')
      .update({
        pixels_available: newQuota,
        last_refill: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('handle', userData.handle)

    if (error) {
      console.error('Error updating user quota:', error)
      return userData.pixels_available // Return original quota on error
    }

    return newQuota
  }

  return userData.pixels_available
}

/**
 * DELETE endpoint for undo functionality
 * Allows users to undo their last pixel placement
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required', 
          code: ERROR_CODES.PERMISSION_DENIED 
        },
        { status: 401 }
      )
    }

    // Get user's handle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('handle, pixels_available')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found', 
          code: ERROR_CODES.PERMISSION_DENIED 
        },
        { status: 404 }
      )
    }

    // Parse request body to get frame ID
    const { frameId } = await request.json()

    if (!frameId || typeof frameId !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Frame ID is required', 
          code: ERROR_CODES.FRAME_NOT_FOUND 
        },
        { status: 400 }
      )
    }

    // Get user's last pixel in this frame
    const { data: lastPixel, error: pixelError } = await supabase
      .from('pixels')
      .select('id, x, y, color, placed_at')
      .eq('frame_id', frameId)
      .eq('contributor_handle', userData.handle)
      .order('placed_at', { ascending: false })
      .limit(1)
      .single()

    if (pixelError || !lastPixel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No pixels to undo', 
          code: 'NO_PIXELS_TO_UNDO' 
        },
        { status: 404 }
      )
    }

    // Check if the pixel was placed recently (within 5 minutes)
    const pixelAge = Date.now() - new Date(lastPixel.placed_at).getTime()
    const fiveMinutes = 5 * 60 * 1000

    if (pixelAge > fiveMinutes) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pixel is too old to undo (5 minute limit)', 
          code: 'UNDO_TIME_EXPIRED' 
        },
        { status: 403 }
      )
    }

    // Delete the pixel
    const { error: deleteError } = await supabase
      .from('pixels')
      .delete()
      .eq('id', lastPixel.id)

    if (deleteError) {
      console.error('Error deleting pixel:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to undo pixel', 
          code: 'DATABASE_ERROR' 
        },
        { status: 500 }
      )
    }

    // Refund the pixel to user's quota (up to max)
    const newQuota = Math.min(
      userData.pixels_available + 1,
      VALIDATION_CONSTRAINTS.PIXELS.MAX_PER_HOUR
    )

    const { error: quotaError } = await supabase
      .from('users')
      .update({ 
        pixels_available: newQuota,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (quotaError) {
      console.error('Error updating quota after undo:', quotaError)
      // Pixel was deleted but quota wasn't refunded
      // This is acceptable as it doesn't harm the user
    }

    return NextResponse.json({
      success: true,
      undonePixel: {
        x: lastPixel.x,
        y: lastPixel.y,
        color: lastPixel.color
      },
      quotaRemaining: newQuota
    })

  } catch (error) {
    console.error('Pixel undo error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
}