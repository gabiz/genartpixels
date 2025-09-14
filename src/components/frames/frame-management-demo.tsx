'use client'

/**
 * Demo component showing integration of all frame management UI components
 * This demonstrates how the components work together in a real application
 */

import React, { useState } from 'react'
import { 
  FrameCreationDialog, 
  FrameSettingsPanel, 
  ContributorManagement, 
  UserPermissionManager 
} from '@/components/frames'
import type { FrameWithStats } from '@/lib/types'

// Mock frame data for demonstration
const mockFrame: FrameWithStats = {
  id: 'demo-frame-1',
  handle: 'demo-frame',
  title: 'Demo Collaborative Frame',
  description: 'A demonstration frame for testing management features',
  keywords: ['demo', 'test', 'collaboration'],
  owner_handle: 'demouser',
  width: 128,
  height: 128,
  permissions: 'approval-required',
  is_frozen: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stats: {
    frame_id: 'demo-frame-1',
    contributors_count: 3,
    total_pixels: 150,
    likes_count: 12,
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export function FrameManagementDemo() {
  const [showCreationDialog, setShowCreationDialog] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showContributorManagement, setShowContributorManagement] = useState(false)
  const [showUserPermissionManager, setShowUserPermissionManager] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<FrameWithStats>(mockFrame)

  const handleFrameCreated = (newFrame: FrameWithStats) => {
    console.log('New frame created:', newFrame)
    setCurrentFrame(newFrame)
  }

  const handleFrameUpdated = (updatedFrame: FrameWithStats) => {
    console.log('Frame updated:', updatedFrame)
    setCurrentFrame(updatedFrame)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Frame Management UI Demo
        </h1>

        {/* Current Frame Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Frame</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Frame Details</h3>
              <p><strong>Title:</strong> {currentFrame.title}</p>
              <p><strong>Handle:</strong> {currentFrame.handle}</p>
              <p><strong>Owner:</strong> @{currentFrame.owner_handle}</p>
              <p><strong>Size:</strong> {currentFrame.width} × {currentFrame.height}</p>
              <p><strong>Permissions:</strong> {currentFrame.permissions}</p>
              <p><strong>Status:</strong> {currentFrame.is_frozen ? 'Frozen' : 'Active'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Statistics</h3>
              <p><strong>Contributors:</strong> {currentFrame.stats.contributors_count}</p>
              <p><strong>Total Pixels:</strong> {currentFrame.stats.total_pixels}</p>
              <p><strong>Likes:</strong> {currentFrame.stats.likes_count}</p>
              <p><strong>Created:</strong> {currentFrame.created_at ? new Date(currentFrame.created_at).toLocaleDateString() : 'Unknown date'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setShowCreationDialog(true)}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Frame
          </button>
          
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Frame Settings
          </button>
          
          <button
            onClick={() => setShowContributorManagement(true)}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage Contributors
          </button>
          
          <button
            onClick={() => setShowUserPermissionManager(true)}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            User Management
          </button>
        </div>

        {/* Component Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Frame Creation Dialog</h3>
            <p className="text-gray-600 mb-4">
              Allows users to create new collaborative frames with customizable settings including size, 
              permissions, and metadata.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Form validation for all inputs</li>
              <li>• Predefined frame size options</li>
              <li>• Permission level selection</li>
              <li>• Real-time error feedback</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Frame Settings Panel</h3>
            <p className="text-gray-600 mb-4">
              Enables frame owners to modify frame settings, toggle freeze status, and view statistics.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Freeze/unfreeze frame functionality</li>
              <li>• Permission level changes</li>
              <li>• Real-time statistics display</li>
              <li>• Owner-only access control</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contributor Management</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive interface for managing contributors in approval-required frames.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Invite users by handle</li>
              <li>• Approve/reject access requests</li>
              <li>• Block/unblock contributors</li>
              <li>• Remove user permissions</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">User Permission Manager</h3>
            <p className="text-gray-600 mb-4">
              Advanced user management tools for frame owners to handle problematic users.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Block users by handle</li>
              <li>• Remove user contributions</li>
              <li>• Quick action shortcuts</li>
              <li>• Validation and error handling</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dialogs and Panels */}
      {showCreationDialog && (
        <FrameCreationDialog
          isOpen={showCreationDialog}
          onClose={() => setShowCreationDialog(false)}
          onFrameCreated={handleFrameCreated}
        />
      )}

      {showSettingsPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <FrameSettingsPanel
            frame={currentFrame}
            onFrameUpdated={handleFrameUpdated}
            onClose={() => setShowSettingsPanel(false)}
          />
        </div>
      )}

      {showContributorManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ContributorManagement
            frame={currentFrame}
            onClose={() => setShowContributorManagement(false)}
          />
        </div>
      )}

      {showUserPermissionManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <UserPermissionManager
            frame={currentFrame}
            onClose={() => setShowUserPermissionManager(false)}
          />
        </div>
      )}
    </div>
  )
}