/**
 * User Profile Component
 * Displays user information, statistics, and frame collections
 */

'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/lib/auth/context'
import { FramePreview } from '@/components/frames/frame-preview'
import type { User } from '@/lib/auth/types'

interface UserWithStats extends User {
  frames_created: number
  frames_contributed_to: number
  total_pixels_placed: number
  frames_liked: number
}

interface Frame {
  id: string
  handle: string
  title: string
  description?: string
  owner_handle: string
  width: number
  height: number
  created_at: string
  contributors_count?: number
  total_pixels?: number
  likes_count?: number
  last_activity?: string
}

interface ContributedFrame {
  frame_id: string
  last_contribution: string
  frame: Frame
}

interface UserProfileProps {
  user: UserWithStats
  ownedFrames: Frame[]
  contributedFrames: ContributedFrame[]
}

export function UserProfile({ user, ownedFrames, contributedFrames }: UserProfileProps) {
  const { user: currentUser } = useAuth()
  const isOwnProfile = currentUser?.handle === user.handle

  const joinedDate = new Date(user.created_at)
  const joinedAgo = formatDistanceToNow(joinedDate, { addSuffix: true })

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={`${user.handle}'s avatar`}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {user.handle.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.handle}</h1>
                <p className="text-gray-600 mt-1">
                  Joined {joinedAgo}
                </p>
              </div>
              
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{user.frames_created}</div>
                <div className="text-sm text-gray-600">Frames Created</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{user.total_pixels_placed}</div>
                <div className="text-sm text-gray-600">Pixels Placed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{user.frames_contributed_to}</div>
                <div className="text-sm text-gray-600">Frames Contributed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{user.frames_liked}</div>
                <div className="text-sm text-gray-600">Frames Liked</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owned Frames Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Created Frames ({user.frames_created})
          </h2>
          {ownedFrames.length > 12 && (
            <Link
              href={`/${user.handle}/frames`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          )}
        </div>

        {ownedFrames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ownedFrames.map((frame) => (
              <FramePreview
                key={frame.id}
                frame={frame}
                showOwner={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600">
              {isOwnProfile ? "You haven't created any frames yet." : `${user.handle} hasn't created any frames yet.`}
            </p>
            {isOwnProfile && (
              <Link
                href="/frames/create"
                className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Your First Frame
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Contributed Frames Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Contributions ({user.frames_contributed_to})
          </h2>
          {contributedFrames.length > 12 && (
            <Link
              href={`/${user.handle}/contributions`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          )}
        </div>

        {contributedFrames.length < 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contributedFrames.map((contribution) => (
              <div key={contribution.frame_id} className="relative">
                <FramePreview
                  frame={contribution.frame}
                  showOwner={true}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Last contributed {formatDistanceToNow(new Date(contribution.last_contribution), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <p className="text-gray-600">
              {isOwnProfile ? "You haven't contributed to any frames yet." : `${user.handle} hasn't contributed to any frames yet.`}
            </p>
            {isOwnProfile && (
              <Link
                href="/"
                className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Explore Frames
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}