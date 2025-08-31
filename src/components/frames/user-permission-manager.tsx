'use client'

/**
 * User permission manager component
 * Allows frame owners to block users and manage permissions with bulk actions
 */

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import { type FrameWithStats, type UserPermissionType } from '@/lib/types'
import { validateHandle } from '@/lib/validation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface UserPermissionManagerProps {
  frame: FrameWithStats
  onClose: () => void
}

interface BlockUserForm {
  handle: string
  error?: string
}

interface RemoveContributionsForm {
  handle: string
  error?: string
}

export function UserPermissionManager({ frame, onClose }: UserPermissionManagerProps) {
  const { user } = useAuth()
  const [blockForm, setBlockForm] = useState<BlockUserForm>({ handle: '' })
  const [removeForm, setRemoveForm] = useState<RemoveContributionsForm>({ handle: '' })
  const [isBlocking, setIsBlocking] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Check if current user is the frame owner
  const isOwner = user?.handle === frame.owner_handle

  // Block user by handle
  const handleBlockUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateHandle(blockForm.handle)) {
      setBlockForm(prev => ({ 
        ...prev, 
        error: 'Handle must be 5-20 characters, alphanumeric, underscore, and dash only' 
      }))
      return
    }

    if (blockForm.handle === frame.owner_handle) {
      setBlockForm(prev => ({ 
        ...prev, 
        error: 'Cannot block the frame owner' 
      }))
      return
    }

    setIsBlocking(true)
    setBlockForm(prev => ({ ...prev, error: undefined }))
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/frames/${frame.owner_handle}/${frame.handle}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUserHandle: blockForm.handle,
          permissionType: 'blocked' as UserPermissionType
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`User @${blockForm.handle} has been blocked from this frame`)
        setBlockForm({ handle: '' })
      } else {
        setBlockForm(prev => ({ 
          ...prev, 
          error: result.error || 'Failed to block user' 
        }))
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      setBlockForm(prev => ({ 
        ...prev, 
        error: 'Network error occurred' 
      }))
    } finally {
      setIsBlocking(false)
    }
  }, [blockForm.handle, frame.owner_handle, frame.handle])

  // Remove user contributions (placeholder - would need backend implementation)
  const handleRemoveContributions = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateHandle(removeForm.handle)) {
      setRemoveForm(prev => ({ 
        ...prev, 
        error: 'Handle must be 5-20 characters, alphanumeric, underscore, and dash only' 
      }))
      return
    }

    if (removeForm.handle === frame.owner_handle) {
      setRemoveForm(prev => ({ 
        ...prev, 
        error: 'Cannot remove contributions from the frame owner' 
      }))
      return
    }

    setIsRemoving(true)
    setRemoveForm(prev => ({ ...prev, error: undefined }))
    setError('')
    setSuccess('')

    try {
      // This would need a backend endpoint to remove user's pixels
      const response = await fetch(`/api/frames/${frame.owner_handle}/${frame.handle}/remove-contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUserHandle: removeForm.handle
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`All contributions from @${removeForm.handle} have been removed`)
        setRemoveForm({ handle: '' })
      } else {
        setRemoveForm(prev => ({ 
          ...prev, 
          error: result.error || 'Failed to remove contributions' 
        }))
      }
    } catch (error) {
      console.error('Error removing contributions:', error)
      // For now, show a placeholder message since this endpoint doesn't exist yet
      setRemoveForm(prev => ({ 
        ...prev, 
        error: 'This feature is not yet implemented' 
      }))
    } finally {
      setIsRemoving(false)
    }
  }, [removeForm.handle, frame.owner_handle, frame.handle])

  if (!isOwner) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600">Only the frame owner can manage users.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-6">
        {/* Block User Section */}
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h4 className="text-sm font-medium text-red-800 mb-3">Block User</h4>
          <p className="text-sm text-red-700 mb-4">
            Blocked users cannot place pixels on this frame. Existing pixels remain.
          </p>
          <form onSubmit={handleBlockUser} className="space-y-3">
            <div>
              <input
                type="text"
                value={blockForm.handle}
                onChange={(e) => setBlockForm({ handle: e.target.value })}
                placeholder="Enter user handle to block"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  blockForm.error ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isBlocking}
              />
              {blockForm.error && (
                <p className="mt-1 text-sm text-red-600">{blockForm.error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isBlocking || !blockForm.handle.trim()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isBlocking && <LoadingSpinner size="sm" className="mr-2" />}
              {isBlocking ? 'Blocking...' : 'Block User'}
            </button>
          </form>
        </div>

        {/* Remove Contributions Section */}
        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
          <h4 className="text-sm font-medium text-orange-800 mb-3">Remove User Contributions</h4>
          <p className="text-sm text-orange-700 mb-4">
            Remove all pixels placed by a specific user. This action cannot be undone.
          </p>
          <form onSubmit={handleRemoveContributions} className="space-y-3">
            <div>
              <input
                type="text"
                value={removeForm.handle}
                onChange={(e) => setRemoveForm({ handle: e.target.value })}
                placeholder="Enter user handle"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  removeForm.error ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isRemoving}
              />
              {removeForm.error && (
                <p className="mt-1 text-sm text-red-600">{removeForm.error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isRemoving || !removeForm.handle.trim()}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRemoving && <LoadingSpinner size="sm" className="mr-2" />}
              {isRemoving ? 'Removing...' : 'Remove Contributions'}
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                // This would open the contributor management dialog
                console.log('Open contributor management')
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Manage Contributors
            </button>
            <button
              onClick={() => {
                // This would open frame settings
                console.log('Open frame settings')
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Frame Settings
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}