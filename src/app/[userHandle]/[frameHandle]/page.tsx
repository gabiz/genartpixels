/**
 * Public frame viewer page accessible via /userHandle/frameHandle URLs
 * Provides responsive layout for viewing and editing frames on mobile and desktop
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/serverClient'
import { FrameViewer } from '@/components/frames/frame-viewer'
import type { FrameWithStats, FramePermission } from '@/lib/types'

interface PageProps {
  params: Promise<{
    userHandle: string
    frameHandle: string
  }>
}

async function getFrameData(userHandle: string, frameHandle: string) {
  const supabase = await createServerClient()

  // Get the current user (if authenticated)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentUserHandle: string | null = null

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('handle')
      .eq('id', user.id)
      .single()

    currentUserHandle = userData?.handle || null
  }

  // Get frame with stats using the view
  const { data: frameData, error: frameError } = await supabase
    .from('frame_details')
    .select('*')
    .eq('owner_handle', userHandle)
    .eq('handle', frameHandle)
    .single()

  if (frameError || !frameData) {
    return null
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
    return null
  }

  return {
    frame,
    userPermission,
    currentUserHandle
  }
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userHandle, frameHandle } = await params
  
  const frameData = await getFrameData(userHandle, frameHandle)
  
  if (!frameData) {
    return {
      title: 'Frame Not Found',
      description: 'The requested frame could not be found.'
    }
  }

  const { frame } = frameData
  const frameUrl = `/${userHandle}/${frameHandle}`
  
  return {
    title: `${frame.title} by @${frame.owner_handle} | Gen Art Pixels`,
    description: frame.description || `Collaborative pixel art frame "${frame.title}" created by @${frame.owner_handle}. Join the community and add your pixels!`,
    keywords: frame.keywords,
    openGraph: {
      title: frame.title,
      description: frame.description || `Collaborative pixel art by @${frame.owner_handle}`,
      url: frameUrl,
      type: 'website',
      images: [
        {
          url: `/api/frames/${userHandle}/${frameHandle}/image`,
          width: frame.width * 4, // Scale up for better preview
          height: frame.height * 4,
          alt: frame.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: frame.title,
      description: frame.description || `Collaborative pixel art by @${frame.owner_handle}`,
      images: [`/api/frames/${userHandle}/${frameHandle}/image`]
    },
    alternates: {
      canonical: frameUrl
    }
  }
}

export default async function FramePage({ params }: PageProps) {
  const { userHandle, frameHandle } = await params
  
  const frameData = await getFrameData(userHandle, frameHandle)
  
  if (!frameData) {
    notFound()
  }

  const { frame, userPermission, currentUserHandle } = frameData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FrameViewer
        frame={frame}
        userPermission={userPermission}
        currentUserHandle={currentUserHandle}
        frameOwnerHandle={userHandle}
        frameHandle={frameHandle}
      />
    </div>
  )
}