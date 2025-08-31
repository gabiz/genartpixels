'use client'

/**
 * Contributor management interface
 * Allows frame owners to manage contributors for approval-required frames
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import { type FrameWithStats, type FramePermission, type UserPermissionType } from '@/lib/types'
import { validateHandle } from '@/lib/validation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ContributorManagementProps {
  frame: FrameWithStats
  onClose: () => void
}

interface InviteUserForm {
  handle: string
  error?: string
}

export function ContributorManagement({ frame, onClose }: ContributorManagementProps) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<FramePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteForm, setInviteForm] = useState<InviteUserForm>({ handle: '' })
  const [isInviting, setIsInviting] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Check if current user is the frame owner
  const isOwner = user?.handle === frame.owner_handle

  // Load frame permissions
  const loadPermissions = useCallback(async () => {
    if (!isOwner) return

    try {
      const response = await fetch(`/api/frames/${frame.owner_handle}/${frame.handle}/permissions`, {
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        setPermissions(result.data)
      } else {
        setError(result.error || 'Failed to load permissions')
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [frame.owner_handle, frame.handle, isOwner])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Invite user by handle
  const handleInviteUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateHandle(inviteForm.handle)) {
      setInviteForm(prev => ({ 
        ...prev, 
        error: 'Handle must be 5-20 characters, alphanumeric, underscore, and dash only' 
      }))
      return
    }

    setIsInviting(true)
    setInviteForm(prev => ({ ...prev, error: undefined }))

    try {
      const response = await fetch(`/api/frames/${frame.owner_handle}/${frame.handle}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUserHandle: inviteForm.handle,
          permissionType: 'contributor'
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPermissions(prev => [result.data, ...prev])
        setInviteForm({ handle: '' })
      } else {
        setInviteForm(prev => ({ 
          ...prev, 
          error: result.error || 'Failed to invite user' 
        }))
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      setInviteForm(prev => ({ 
        ...prev, 
        error: 'Network error occurred' 
      }))
    } finally {
      setIsInviting(false)
    }
  }, [inviteForm.handle, frame.owner_handle, frame.handle])

  // Update user permission
  const updatePermission = useCallback(async (userHandle: string, permissionType: UserPermissionType) => {
    setIsUpdating(userHandle)

    try {
      const response = await fetch(`/api/frames/${frame.owner_handle}/${frame.handle}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUserHandle: userHandle,
          permissionType
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPermissions(prev => 
          prev.map(p => 
            p.user_handle === userHandle 
              ? { ...p, permission_type: permissionType }
              : p
          )
        )
      } else {
        setError(result.error || 'Failed to update permission')
      }
    } catch (error) {
      console.error('Error updating permission:', error)
      setError('Network error occurred')
    } finally {
      setIsUpdating('')
    }
  }, [frame.owner_handle, frame.handle])

  // Remove user permission
  const removePermission = useCallback(async (userHandle: string) => {
    setIsUpdating(userHandle)

    try {
      const response = await fetch(
        `/api/frames/${frame.owner_handle}/${frame.handle}/permissions?userHandle=${encodeURIComponent(userHandle)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      const result = await response.json()

      if (result.success) {
        setPermissions(prev => prev.filter(p => p.user_handle !== userHandle))
      } else {
        setError(result.error || 'Failed to remove permission')
      }
    } catch (error) {
      console.error('Error removing permission:', error)
      setError('Network error occurred')
    } finally {
      setIsUpdating('')
    }
  }, [frame.owner_handle, frame.handle])

  if (!isOwner) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contributor Management</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600">Only the frame owner can manage contributors.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const contributors = (permissions || []).filter(p => p.permission_type === 'contributor')
  const pendingRequests = (permissions || []).filter(p => p.permission_type === 'pending')
  const blockedUsers = (permissions || []).filter(p => p.permission_type === 'blocked')

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Contributor Management</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-6">
        {/* Invite User Form */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Invite Contributor</h4>
          <form onSubmit={handleInviteUser} className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={inviteForm.handle}
                onChange={(e) => setInviteForm({ handle: e.target.value })}
                placeholder="Enter user handle"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  inviteForm.error ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isInviting}
              />
              {inviteForm.error && (
                <p className="mt-1 text-sm text-red-600">{inviteForm.error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isInviting || !inviteForm.handle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isInviting && <LoadingSpinner size="sm" className="mr-2" />}
              {isInviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Pending Requests ({pendingRequests.length})
            </h4>
            <div className="space-y-2">
              {pendingRequests.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">@{permission.user_handle}</div>
                    <div className="text-sm text-gray-500">
                      Requested access on {new Date(permission.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updatePermission(permission.user_handle, 'contributor')}
                      disabled={isUpdating === permission.user_handle}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating === permission.user_handle ? <LoadingSpinner size="sm" /> : 'Approve'}
                    </button>
                    <button
                      onClick={() => removePermission(permission.user_handle)}
                      disabled={isUpdating === permission.user_handle}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating === permission.user_handle ? <LoadingSpinner size="sm" /> : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributors */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Contributors ({contributors.length})
          </h4>
          {contributors.length === 0 ? (
            <p className="text-gray-500 text-sm">No contributors yet. Invite users to collaborate!</p>
          ) : (
            <div className="space-y-2">
              {contributors.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">@{permission.user_handle}</div>
                    <div className="text-sm text-gray-500">
                      Added on {new Date(permission.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updatePermission(permission.user_handle, 'blocked')}
                      disabled={isUpdating === permission.user_handle}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating === permission.user_handle ? <LoadingSpinner size="sm" /> : 'Block'}
                    </button>
                    <button
                      onClick={() => removePermission(permission.user_handle)}
                      disabled={isUpdating === permission.user_handle}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating === permission.user_handle ? <LoadingSpinner size="sm" /> : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blocked Users */}
        {blockedUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Blocked Users ({blockedUsers.length})
            </h4>
            <div className="space-y-2">
              {blockedUsers.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">@{permission.user_handle}</div>
                    <div className="text-sm text-gray-500">
                      Blocked on {new Date(permission.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updatePermission(permission.user_handle, 'contributor')}
                      disabled={isUpdating === permission.user_handle}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating === permission.user_handle ? <LoadingSpinner size="sm" /> : 'Unblock'}
                    </button>
                    <button
                      onClick={() => removePermission(permission.user_handle)}
                      disabled={isUpdating === permission.user_handle}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating === permission.user_handle ? <LoadingSpinner size="sm" /> : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
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