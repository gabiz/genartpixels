/**
 * API routes for frame management
 * GET /api/frames - List frames with search and pagination
 * POST /api/frames - Create new frame
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/serverClient'
import {
  validateFrameHandle,
  validateFrameTitle,
  validateFrameDescription,
  validateFrameKeywords,
  validateFrameDimensions,
  validateFramePermissions,
  sanitizeString,
  VALIDATION_MESSAGES
} from '@/lib/validation'
import type {
  CreateFrameRequest,
  FrameListResponse,
  APIResponse,
  APIError,
  FrameWithStats,
  FramePermissionType
} from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const offset = (page - 1) * limit

    // Build query for frames with stats
    let query = supabase
      .from('frame_details')
      .select('*')

    // Apply search filter if provided
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},keywords.cs.{${search.trim()}}`)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'total_pixels', 'contributors_count', 'likes_count', 'last_activity']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: frames, error, count } = await query

    if (error) {
      console.error('Error fetching frames:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch frames', code: 'DATABASE_ERROR' } as APIError,
        { status: 500 }
      )
    }

    // Transform the data to match FrameWithStats interface
    const framesWithStats: FrameWithStats[] = (frames || []).map(frame => ({
      id: frame.id!,
      handle: frame.handle!,
      title: frame.title!,
      description: frame.description,
      keywords: frame.keywords || [],
      owner_handle: frame.owner_handle!,
      width: frame.width!,
      height: frame.height!,
      permissions: frame.permissions || 'open',
      is_frozen: frame.is_frozen || false,
      created_at: frame.created_at,
      updated_at: frame.updated_at,
      stats: {
        frame_id: frame.id!,
        contributors_count: frame.contributors_count || 0,
        total_pixels: frame.total_pixels || 0,
        likes_count: frame.likes_count || 0,
        last_activity: frame.last_activity,
        updated_at: frame.updated_at
      }
    }))

    const response: APIResponse<FrameListResponse> = {
      success: true,
      data: {
        frames: framesWithStats,
        total: count || 0,
        page,
        limit
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in frames GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

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

    // Parse and validate request body
    const body: CreateFrameRequest = await request.json()
    const { handle, title, description, keywords, width, height, permissions } = body

    // Validate all inputs
    if (!validateFrameHandle(handle)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_FRAME_HANDLE, code: 'INVALID_HANDLE' } as APIError,
        { status: 400 }
      )
    }

    if (!validateFrameTitle(title)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_TITLE, code: 'INVALID_TITLE' } as APIError,
        { status: 400 }
      )
    }

    if (!validateFrameDescription(description)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_DESCRIPTION, code: 'INVALID_DESCRIPTION' } as APIError,
        { status: 400 }
      )
    }

    if (!validateFrameKeywords(keywords)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_KEYWORDS, code: 'INVALID_KEYWORDS' } as APIError,
        { status: 400 }
      )
    }

    if (!validateFrameDimensions(width, height)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_DIMENSIONS, code: 'INVALID_DIMENSIONS' } as APIError,
        { status: 400 }
      )
    }

    if (!validateFramePermissions(permissions)) {
      return NextResponse.json(
        { success: false, error: VALIDATION_MESSAGES.INVALID_PERMISSIONS, code: 'INVALID_PERMISSIONS' } as APIError,
        { status: 400 }
      )
    }

    // Check if frame handle is unique for this user
    const { data: existingFrame, error: checkError } = await supabase
      .from('frames')
      .select('id')
      .eq('owner_handle', userData.handle)
      .eq('handle', handle)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking frame handle uniqueness:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error occurred', code: 'DATABASE_ERROR' } as APIError,
        { status: 500 }
      )
    }

    if (existingFrame) {
      return NextResponse.json(
        { success: false, error: 'Frame handle already exists for this user', code: 'HANDLE_EXISTS' } as APIError,
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title, 255)
    const sanitizedDescription = sanitizeString(description, 1000)
    const sanitizedKeywords = keywords.map(keyword => sanitizeString(keyword, 50)).filter(k => k.length > 0)

    // Create the frame
    const { data: newFrame, error: createError } = await supabase
      .from('frames')
      .insert({
        handle,
        title: sanitizedTitle,
        description: sanitizedDescription,
        keywords: sanitizedKeywords,
        owner_handle: userData.handle,
        width,
        height,
        permissions: permissions as FramePermissionType,
        is_frozen: false
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating frame:', createError)
      
      // Handle unique constraint violations
      if (createError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Frame handle already exists for this user', code: 'HANDLE_EXISTS' } as APIError,
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create frame', code: 'CREATE_FAILED' } as APIError,
        { status: 500 }
      )
    }

    // Initialize frame stats
    const { error: statsError } = await supabase
      .from('frame_stats')
      .insert({
        frame_id: newFrame.id,
        contributors_count: 0,
        total_pixels: 0,
        likes_count: 0,
        last_activity: new Date().toISOString()
      })

    if (statsError) {
      console.error('Error creating frame stats:', statsError)
      // Don't fail the request if stats creation fails, just log it
    }

    // Return the created frame with stats
    const frameWithStats: FrameWithStats = {
      ...newFrame,
      stats: {
        frame_id: newFrame.id,
        contributors_count: 0,
        total_pixels: 0,
        likes_count: 0,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    const response: APIResponse<FrameWithStats> = {
      success: true,
      data: frameWithStats
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in frames POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' } as APIError,
      { status: 500 }
    )
  }
}