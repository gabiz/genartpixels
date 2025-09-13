/**
 * Test page for user profile functionality
 */

'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/components/user/user-profile'
import { HandleSelection } from '@/components/user/handle-selection'
import { UserSettings } from '@/components/user/user-settings'

const mockUser = {
  id: 'test-user-id',
  handle: 'test_user',
  email: 'test@example.com',
  avatar_url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=master',
  pixels_available: 75,
  last_refill: '2024-01-01T12:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
  frames_created: 5,
  frames_contributed_to: 12,
  total_pixels_placed: 150,
  frames_liked: 8,
}

const mockOwnedFrames = [
  {
    id: 'frame-1',
    handle: 'test-frame',
    title: 'Test Frame',
    description: 'A test frame for demonstration',
    owner_handle: 'test_user',
    width: 128,
    height: 128,
    created_at: '2024-01-01T00:00:00Z',
    stats: {
      contributors_count: 3,
      total_pixels: 50,
      likes_count: 2,
    }
  },
  {
    id: 'frame-2',
    handle: 'another-frame',
    title: 'Another Frame',
    description: 'Another test frame',
    owner_handle: 'test_user',
    width: 256,
    height: 256,
    created_at: '2024-01-02T00:00:00Z',
    stats: {
      contributors_count: 5,
      total_pixels: 120,
      likes_count: 8,
    }
  },
]

const mockContributedFrames = [
  {
    frame_id: 'frame-3',
    last_contribution: '2024-01-01T10:00:00Z',
    frame: {
      id: 'frame-3',
      handle: 'community-frame',
      title: 'Community Frame',
      owner_handle: 'other_user',
      width: 128,
      height: 128,
      created_at: '2024-01-01T00:00:00Z',
    },
  },
]

export default function UserProfileTestPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'handle' | 'settings'>('profile')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Profile Test Page</h1>
          <p className="mt-2 text-gray-600">
            Test the user profile, handle selection, and settings components
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Profile
            </button>
            <button
              onClick={() => setActiveTab('handle')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'handle'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Handle Selection
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Settings
            </button>
          </nav>
        </div>

        Tab Content
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Profile Component</h2>
            <UserProfile
              user={mockUser}
              ownedFrames={mockOwnedFrames}
              contributedFrames={mockContributedFrames}
            />
          </div>
        )}

        {activeTab === 'handle' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Handle Selection Component</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 mb-4">
                This component would normally be shown during registration when a user needs to create their handle.
              </p>
              <HandleSelection onComplete={() => alert('Handle created!')} />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Settings Component</h2>
            <UserSettings user={mockUser} />
          </div>
        )}
      </div>
    </div>
  )
}