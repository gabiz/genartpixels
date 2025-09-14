/**
 * User Profile Page
 * Displays user information, owned frames, and contribution statistics
 * Route: /[userHandle]
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/serverClient'
import { UserProfile } from '@/components/user/user-profile'
import type { User } from '@/lib/auth/types'

interface UserProfilePageProps {
  params: {
    userHandle: string
  }
}

interface UserWithStats extends User {
  frames_created: number
  frames_contributed_to: number
  total_pixels_placed: number
  frames_liked: number
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userHandle } =  await params

  // Create Supabase client for server-side data fetching
  // const cookieStore = cookies()
  // const supabase = createSeverClient({ cookies: () => cookieStore })
  const supabase = await createServerClient()

  // Fetch user data for metadata
  const { data: user } = await supabase
    .from('users')
    .select('handle, created_at')
    .eq('handle', userHandle)
    .single()

  if (!user) {
    return {
      title: 'User Not Found - Gen Art Pixels',
      description: 'The requested user profile could not be found.',
    }
  }

  return {
    title: `${user.handle} - Gen Art Pixels`,
    description: `View ${user.handle}'s pixel art frames and contributions on Gen Art Pixels.`,
    openGraph: {
      title: `${user.handle} - Gen Art Pixels`,
      description: `View ${user.handle}'s pixel art frames and contributions on Gen Art Pixels.`,
      type: 'profile',
    },
  }
}

async function getUserWithStats(userHandle: string): Promise<UserWithStats | null> {
  // const cookieStore = await cookies()
  // const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const supabase = await createServerClient()

  // Fetch user data with statistics
  const { data: user, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('handle', userHandle)
    .single()

  if (error || !user) {
    return null
  }

  // Fetch additional user details
  const { data: userDetails } = await supabase
    .from('users')
    .select('*')
    .eq('handle', userHandle)
    .single()

  if (!userDetails) {
    return null
  }

  return {
    ...userDetails,
    frames_created: user.frames_created || 0,
    frames_contributed_to: user.frames_contributed_to || 0,
    total_pixels_placed: user.total_pixels_placed || 0,
    frames_liked: user.frames_liked || 0,
  }
}

async function getUserFrames(userHandle: string) {
  // const cookieStore = await cookies()
  // const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const supabase = await createServerClient()

  // Fetch user's owned frames with stats
  const { data: ownedFrames } = await supabase
    .from('frame_details')
    .select('*')
    .eq('owner_handle', userHandle)
    .order('created_at', { ascending: false })
    .limit(12)

  // Fetch frames user has contributed to (recent contributions)
  const { data: contributedFrames } = await supabase
    .from('pixels')
    .select(`
      frame_id,
      placed_at,
      frames!inner(
        id,
        handle,
        title,
        owner_handle,
        width,
        height,
        created_at
      )
    `)
    .eq('contributor_handle', userHandle)
    .order('placed_at', { ascending: false })
    .limit(12)

  // Process contributed frames to remove duplicates and get unique frames
  const uniqueContributedFrames = contributedFrames?.reduce((acc, pixel) => {
    const frameId = pixel.frame_id
    if (!acc.find(item => item.frame_id === frameId)) {
      acc.push({
        frame_id: frameId,
        last_contribution: pixel.placed_at,
        frame: pixel.frames,
      })
    }
    return acc
  }, [] as any[])

  return {
    ownedFrames: ownedFrames ? ownedFrames.map(({ contributors_count, total_pixels, likes_count, last_activity, ...rest }) => ({
      ...rest,
      stats: {
        contributors_count,
        total_pixels,
        likes_count,
        last_activity,
      },
    })) : [],
    contributedFrames: uniqueContributedFrames || [],
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userHandle } = await params

  // Validate handle format
  if (!/^[a-zA-Z0-9_-]{5,20}$/.test(userHandle)) {
    notFound()
  }

  const [userWithStats, userFrames] = await Promise.all([
    getUserWithStats(userHandle),
    getUserFrames(userHandle),
  ])

  if (!userWithStats) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserProfile
          user={userWithStats}
          ownedFrames={userFrames.ownedFrames}
          contributedFrames={userFrames.contributedFrames}
        />
      </div>
    </div>
  )
}