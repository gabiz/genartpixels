/**
 * Handle Selection Component
 * Interface for users to create their unique handle during registration
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { validateHandle, VALIDATION_MESSAGES } from '@/lib/validation'

interface HandleSelectionProps {
  onComplete?: () => void
}

export function HandleSelection({ onComplete }: HandleSelectionProps) {
  const { createHandle, user, supabaseUser } = useAuth()
  const [handle, setHandle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Redirect if user already has a handle
  useEffect(() => {
    if (user?.handle) {
      onComplete?.()
    }
  }, [user, onComplete])

  // Real-time validation
  useEffect(() => {
    if (!handle) {
      setValidationError('')
      return
    }

    const timeoutId = setTimeout(() => {
      if (!validateHandle(handle)) {
        setValidationError(VALIDATION_MESSAGES.INVALID_HANDLE)
      } else {
        setValidationError('')
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [handle])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!handle || validationError || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await createHandle(handle)
      
      if (result.success) {
        onComplete?.()
      } else {
        setError(result.error || 'Failed to create handle')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }, [handle, validationError, isSubmitting, createHandle, onComplete])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setHandle(value)
    setError('')
  }, [])

  if (!supabaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to continue
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Handle
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your handle is your unique identifier on Gen Art Pixels. Choose wisely - it cannot be changed later.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
              Handle
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">@</span>
              </div>
              <input
                id="handle"
                name="handle"
                type="text"
                required
                value={handle}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full pl-8 pr-3 py-2 border ${
                  validationError || error ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="your_handle"
                maxLength={20}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Validation feedback */}
            {validationError && (
              <p className="mt-2 text-sm text-red-600">{validationError}</p>
            )}
            
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            
            {/* Handle requirements */}
            <div className="mt-2 text-xs text-gray-500">
              <p>Requirements:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>5-20 characters long</li>
                <li>Letters, numbers, underscores, and dashes only</li>
                <li>Must be unique</li>
              </ul>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !handle || !!validationError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Handle...
                </>
              ) : (
                'Create Handle'
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {handle && !validationError && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Preview
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your profile will be available at: <strong>/{handle}</strong></p>
                  <p>Your frames will be at: <strong>/{handle}/frame-name</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}