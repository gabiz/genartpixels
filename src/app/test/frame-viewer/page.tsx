/**
 * Test page for frame viewer functionality
 * Demonstrates responsive frame viewer with mock data
 */

'use client'

import { useState } from 'react'
import { FrameViewer } from '@/components/frames/frame-viewer'
import type { FrameWithStats, FramePermission } from '@/lib/types'

const mockFrame: FrameWithStats = {
  id: 'test-frame-1',
  handle: 'demo-frame',
  title: 'Demo Collaborative Frame',
  description: 'A demonstration frame showing the responsive frame viewer with pixel art collaboration features.',
  keywords: ['demo', 'test', 'collaboration', 'pixel-art'],
  owner_handle: 'demouser',
  width: 128,
  height: 128,
  permissions: 'open',
  is_frozen: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stats: {
    frame_id: 'test-frame-1',
    contributors_count: 12,
    total_pixels: 1547,
    likes_count: 23,
    last_activity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    updated_at: new Date().toISOString()
  }
}

const mockUserPermission: FramePermission = {
  id: 'perm-1',
  frame_id: 'test-frame-1',
  user_handle: 'testuser',
  permission_type: 'contributor',
  granted_by: 'demouser',
  created_at: new Date().toISOString()
}

export default function FrameViewerTestPage() {
  const [currentUser, setCurrentUser] = useState<string | null>('testuser')
  const [framePermissions, setFramePermissions] = useState<'open' | 'approval-required' | 'owner-only'>('open')
  const [isFrozen, setIsFrozen] = useState(false)

  const testFrame = {
    ...mockFrame,
    permissions: framePermissions,
    is_frozen: isFrozen
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Frame Viewer Test Page
          </h1>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Current User:
              </label>
              <select
                value={currentUser || 'none'}
                onChange={(e) => setCurrentUser(e.target.value === 'none' ? null : e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="none">Not logged in</option>
                <option value="testuser">testuser (contributor)</option>
                <option value="demouser">demouser (owner)</option>
                <option value="otheruser">otheruser (no permissions)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Frame Permissions:
              </label>
              <select
                value={framePermissions}
                onChange={(e) => setFramePermissions(e.target.value as 'open' | 'approval-required' | 'owner-only')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="open">Open</option>
                <option value="approval-required">Approval Required</option>
                <option value="owner-only">Owner Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Frame Status:
              </label>
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  isFrozen
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-green-100 text-green-700 border border-green-300'
                }`}
              >
                {isFrozen ? 'Frozen' : 'Active'}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Test Instructions:</strong> This page demonstrates the responsive frame viewer. 
              Try changing the user, permissions, and frame status to see how the interface adapts. 
              Resize your browser window to test mobile responsiveness.
            </p>
          </div>
        </div>
      </div>

      {/* Frame Viewer */}
      <FrameViewer
        frame={testFrame}
        userPermission={currentUser === 'testuser' ? mockUserPermission : null}
        currentUserHandle={currentUser}
        frameOwnerHandle="demouser"
        frameHandle="demo-frame"
      />
    </div>
  )
}