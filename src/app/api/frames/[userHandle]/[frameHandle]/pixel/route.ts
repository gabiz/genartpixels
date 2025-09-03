/**
 * API route for getting pixel contributor information
 * GET /api/frames/[userHandle]/[frameHandle]/pixel?x=0&y=0 - Get pixel contributor
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { APIResponse, APIError, ERROR_CODES } from '@/lib/types'

interface RouteParams {
  params: Promise<{
    userHandle: string
    frameHandle: string
  }>
}

interface PixelInfo {
  x: number
  y: number
  color: number
  contributor_handle: string
  placed_at: string
  isEmpty: boolean
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const { userHandle, frameHandle } = await params

    // Get coordinates from query params
    const xParam = searchParams.get('x')
    const yParam = searchParams.get('y')
    
    if (xParam === null || yParam === null) {
      return NextResponse.json<APIError>({
        error: 'Missing x or y coordinates',
        code: 'INVALID_INPUT',
        success: false
      }, { status: 400 })
    }

    const x = parseInt(xParam, 10)
    const y = parseInt(yParam, 10)

    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      return NextResponse.json<APIError>({
        error: 'Invalid coordinates',
        code: ERROR_CODES.INVALID_COORDINATES,
        success: false
      }, { status: 400 })
    }

    // Get frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select('id, width, height')
      .eq('owner_handle', userHandle)
      .eq('handle', frameHandle)
      .single()

    if (frameError || !frame) {
      return NextResponse.json<APIError>({
        error: 'Frame not found',
        code: ERROR_CODES.FRAME_NOT_FOUND,
        success: false
      }, { status: 404 })
    }

    // Validate coordinates are within frame bounds
    if (x >= frame.width || y >= frame.height) {
      return NextResponse.json<APIError>({
        error: `Coordinates (${x}, ${y}) are outside frame dimensions (${frame.width} x ${frame.height})`,
        code: ERROR_CODES.INVALID_COORDINATES,
        success: false
      }, { status: 400 })
    }

    // Get pixel at coordinates
    const { data: pixel, error: pixelError } = await supabase
      .from('pixels')
      .select('x, y, color, contributor_handle, placed_at')
      .eq('frame_id', frame.id)
      .eq('x', x)
      .eq('y', y)
      .single()

    if (pixelError && pixelError.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json<APIError>({
        error: 'Failed to fetch pixel information',
        code: 'DATABASE_ERROR',
        success: false
      }, { status: 500 })
    }

    if (!pixel) {
      // No pixel at this location (empty/transparent)
      return NextResponse.json<APIResponse<PixelInfo>>({
        data: {
          x,
          y,
          color: 0x00000000, // Transparent
          contributor_handle: '',
          placed_at: '',
          isEmpty: true
        },
        success: true
      })
    }

    return NextResponse.json<APIResponse<PixelInfo>>({
      data: {
        x: pixel.x,
        y: pixel.y,
        color: pixel.color,
        contributor_handle: pixel.contributor_handle,
        placed_at: pixel.placed_at,
        isEmpty: false
      },
      success: true
    })

  } catch (error) {
    console.error('Pixel info error:', error)
    return NextResponse.json<APIError>({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      success: false
    }, { status: 500 })
  }
}