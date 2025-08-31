/**
 * User Settings Component
 * Allows users to manage their profile information and preferences
 */

'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@/lib/auth/types'

interface UserSettingsProps {
  user: User
}

interface ProfileUpdateData {
  avatar_url?: string
}

export function UserSettings({ user: initialUser }: UserSettingsProps) {
  const { refreshUser, signOut } = useAuth()
  const [user, setUser] = useState(initialUser)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateError, setUpdateError] = useState('')

  const handleAvatarUpdate = useCallback(async (avatarUrl: string) => {
    setIsUpdating(true)
    setUpdateError('')
    setUpdateMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      setUser(prev => ({ ...prev, avatar_url: avatarUrl }))
      setUpdateMessage('Avatar updated successfully!')
      await refreshUser()
    } catch (error) {
      console.error('Error updating avatar:', error)
      setUpdateError('Failed to update avatar')
    } finally {
      setIsUpdating(false)
    }
  }, [user.id, refreshUser])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [signOut])

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your basic profile information and avatar
          </p>
        </div>
        
        <div className="px-6 py-6 space-y-6">
          {/* Avatar Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Profile Picture
            </label>
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt="Profile picture"
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
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Your avatar is automatically synced from your social login provider.
                </p>
                <button
                  onClick={() => handleAvatarUpdate('')}
                  disabled={isUpdating || !user.avatar_url}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Remove Avatar'}
                </button>
              </div>
            </div>
          </div>

          {/* Handle Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Handle
            </label>
            <div className="mt-1 flex items-center">
              <span className="text-gray-500 mr-1">@</span>
              <span className="text-gray-900 font-medium">{user.handle}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your handle cannot be changed after creation. It's your permanent identifier on Gen Art Pixels.
            </p>
          </div>

          {/* Email Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <span className="text-gray-900">{user.email}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your email is managed through your social login provider and cannot be changed here.
            </p>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Member Since
            </label>
            <div className="mt-1">
              <span className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Update Messages */}
          {updateMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{updateMessage}</p>
                </div>
              </div>
            </div>
          )}

          {updateError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{updateError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pixel Quota Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Pixel Quota</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your current pixel placement quota and refill information
          </p>
        </div>
        
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Available Pixels
              </label>
              <div className="mt-1">
                <span className="text-2xl font-bold text-blue-600">{user.pixels_available}</span>
                <span className="text-gray-500 ml-2">/ 100</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Refill
              </label>
              <div className="mt-1">
                <span className="text-gray-900">
                  {new Date(user.last_refill).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(user.pixels_available / 100) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your quota refills automatically every hour up to 100 pixels maximum.
            </p>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Account Actions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account and session
          </p>
        </div>
        
        <div className="px-6 py-6">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Sign out of your current session. You can sign back in anytime with your social login.
          </p>
        </div>
      </div>
    </div>
  )
}