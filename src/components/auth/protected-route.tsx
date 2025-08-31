'use client'

/**
 * Protected route component that requires authentication
 * Redirects to login if user is not authenticated
 */

import React from 'react'
import { useAuth } from '@/lib/auth/context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LoginPrompt } from './login-prompt'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireHandle?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireHandle = true, 
  fallback 
}: ProtectedRouteProps) {
  const { user, supabaseUser, loading, initialized } = useAuth()

  // Show loading spinner while auth is initializing
  if (!initialized || loading) {
    return fallback || <LoadingSpinner />
  }

  // Show login prompt if not authenticated
  if (!supabaseUser) {
    return <LoginPrompt />
  }

  // Show handle creation prompt if user doesn't have a handle
  if (requireHandle && !user) {
    return <HandleCreationPrompt />
  }

  // User is authenticated and has handle (if required)
  return <>{children}</>
}

/**
 * Component to prompt handle creation for authenticated users without handles
 */
function HandleCreationPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create Your Handle
          </h2>
          <p className="mt-2 text-gray-600">
            You need to create a unique handle to continue using Gen Art Pixels.
          </p>
        </div>
        <HandleCreationForm />
      </div>
    </div>
  )
}

/**
 * Handle creation form component
 */
function HandleCreationForm() {
  const { createHandle } = useAuth()
  const [handle, setHandle] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await createHandle(handle)
      if (!result.success) {
        setError(result.error || 'Failed to create handle')
      }
      // If successful, the auth context will update and redirect automatically
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
          Handle
        </label>
        <input
          id="handle"
          name="handle"
          type="text"
          required
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="your_handle"
          minLength={5}
          maxLength={20}
          pattern="[a-zA-Z0-9_-]+"
          disabled={loading}
        />
        <p className="mt-1 text-sm text-gray-500">
          5-20 characters, letters, numbers, underscore, and dash only
        </p>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || handle.length < 5}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Handle'}
      </button>
    </form>
  )
}