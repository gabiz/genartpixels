'use client'

/**
 * Frame settings panel component
 * Allows frame owners to manage frame settings like permissions and freeze/unfreeze
 */

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import { type FrameWithStats, type FramePermissionType } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FrameSettingsPanelProps {
  frame: FrameWithStats
  onFrameUpdated: (updatedFrame: FrameWithStats) => void
  onClose: () => void
}

interface UpdateFrameRequest {
  permissions?: FramePermissionType
  is_frozen?: boolean
  title?: string
  description?: string
}

export function FrameSettingsPanel({ frame, onFrameUpdated, onClose }: FrameSettingsPanelProps) {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string>('')

  // Check if current user is the frame owner
  const isOwner = user?.handle === frame.owner_handle

  const updateFrame = useCallback(async (updates: UpdateFrameRequest) => {
    if (!isOwner) {
      setError('Only the frame owner can modify settings')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch(`/api/frames/${frame.owner_handle}/${frame.handle}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (result.success) {
        onFrameUpdated(result.data)
      } else {
        setError(result.error || 'Failed to update frame')
      }
    } catch (error) {
      console.error('Error updating frame:', error)
      setError('Network error occurred. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }, [frame.owner_handle, frame.handle, isOwner, onFrameUpdated])

  const handlePermissionChange = useCallback((permissions: FramePermissionType) => {
    updateFrame({ permissions })
  }, [updateFrame])

  const handleFreezeToggle = useCallback(() => {
    updateFrame({ is_frozen: !frame.is_frozen })
  }, [updateFrame, frame.is_frozen])

  if (!isOwner) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Frame Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600">Only the frame owner can access settings.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Frame Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          disabled={isUpdating}
        >
          ×
        </button>
      </div>

      <div className="space-y-6">
        {/* Frame Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Frame Status</h4>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">
                {frame.is_frozen ? 'Frozen' : 'Active'}
              </div>
              <div className="text-sm text-gray-500">
                {frame.is_frozen 
                  ? 'No new pixels can be placed' 
                  : 'Contributors can place pixels'
                }
              </div>
            </div>
            <button
              onClick={handleFreezeToggle}
              disabled={isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                frame.is_frozen
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isUpdating ? (
                <LoadingSpinner size="sm" />
              ) : (
                frame.is_frozen ? 'Unfreeze' : 'Freeze'
              )}
            </button>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
          <div className="space-y-2">
            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
              frame.permissions === 'open' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="permissions"
                value="open"
                checked={frame.permissions === 'open'}
                onChange={() => handlePermissionChange('open')}
                className="mr-3"
                disabled={isUpdating}
              />
              <div>
                <div className="font-medium text-gray-900">Open</div>
                <div className="text-sm text-gray-500">Anyone can contribute</div>
              </div>
            </label>

            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
              frame.permissions === 'approval-required' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="permissions"
                value="approval-required"
                checked={frame.permissions === 'approval-required'}
                onChange={() => handlePermissionChange('approval-required')}
                className="mr-3"
                disabled={isUpdating}
              />
              <div>
                <div className="font-medium text-gray-900">Approval Required</div>
                <div className="text-sm text-gray-500">You approve contributors</div>
              </div>
            </label>

            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
              frame.permissions === 'owner-only' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="permissions"
                value="owner-only"
                checked={frame.permissions === 'owner-only'}
                onChange={() => handlePermissionChange('owner-only')}
                className="mr-3"
                disabled={isUpdating}
              />
              <div>
                <div className="font-medium text-gray-900">Owner Only</div>
                <div className="text-sm text-gray-500">Only you can contribute</div>
              </div>
            </label>
          </div>
        </div>

        {/* Frame Stats */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{frame.stats.total_pixels}</div>
              <div className="text-sm text-gray-500">Pixels</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{frame.stats.contributors_count}</div>
              <div className="text-sm text-gray-500">Contributors</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{frame.stats.likes_count}</div>
              <div className="text-sm text-gray-500">Likes</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">
                {frame.created_at ? new Date(frame.created_at).toLocaleDateString() : 'Unknown'}
              </div>
              <div className="text-sm text-gray-500">Created</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={isUpdating}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}