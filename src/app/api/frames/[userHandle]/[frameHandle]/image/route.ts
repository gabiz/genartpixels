/**
 * API route for generating frame images for social sharing
 * GET /api/frames/[userHandle]/[frameHandle]/image - Generate frame image
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'

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
    
    // Get frame data
    const { data: frameData, error: frameError } = await supabase
      .from('frame_details')
      .select('*')
      .eq('owner_handle', userHandle)
      .eq('handle', frameHandle)
      .single()

    if (frameError || !frameData) {
      return new NextResponse('Frame not found', { status: 404 })
    }

    // Check if frame is publicly viewable
    if (frameData.permissions === 'owner-only') {
      return new NextResponse('Frame not accessible', { status: 403 })
    }

    // Get recent pixels for the frame
    const { data: pixels, error: pixelsError } = await supabase
      .from('pixels')
      .select('x, y, color')
      .eq('frame_id', frameData.id)
      .order('placed_at', { ascending: false })
      .limit(1000) // Limit for performance

    if (pixelsError) {
      console.error('Error fetching pixels:', pixelsError)
      return new NextResponse('Error generating image', { status: 500 })
    }

    // Generate image
    const imageBuffer = await generateFrameImage(
      frameData.width,
      frameData.height,
      pixels || []
    )

    return new NextResponse(imageBuffer as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error('Error generating frame image:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

async function generateFrameImage(
  width: number,
  height: number,
  pixels: Array<{ x: number; y: number; color: number }>
): Promise<Buffer> {
  // For now, return a simple placeholder image
  // In a full implementation, you would use a library like canvas or sharp
  // to generate an actual pixel art image
  
  const canvas = createCanvas(width * 4, height * 4) // Scale up 4x for better visibility
  const ctx = canvas.getContext('2d')
  
  // Fill background with white
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width * 4, height * 4)
  
  // Draw pixels
  pixels.forEach(pixel => {
    const color = argbToHex(pixel.color)
    if (color !== '#00000000') { // Skip transparent pixels
      ctx.fillStyle = color
      ctx.fillRect(pixel.x * 4, pixel.y * 4, 4, 4)
    }
  })
  
  // Add border
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, width * 4, height * 4)
  
  return canvas.toBuffer('image/png')
}

function createCanvas(width: number, height: number) {
  // Simplified canvas implementation for demonstration
  // In a real implementation, you'd use the 'canvas' npm package
  return {
    getContext: (type: string) => ({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: (x: number, y: number, w: number, h: number) => {},
      strokeRect: (x: number, y: number, w: number, h: number) => {},
    }),
    toBuffer: (format: string) => Buffer.from('placeholder-image-data')
  }
}

function argbToHex(argb: number): string {
  const a = (argb >>> 24) & 0xFF
  const r = (argb >>> 16) & 0xFF
  const g = (argb >>> 8) & 0xFF
  const b = argb & 0xFF
  
  if (a === 0) return '#00000000' // Transparent
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}