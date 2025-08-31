'use client'

/**
 * Frame creation dialog component
 * Allows users to create new frames with size selection and metadata inputs
 */

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import { FRAME_SIZES, type FrameSize, type CreateFrameRequest, type FrameWithStats } from '@/lib/types'
import { validateFrameHandle, validateFrameTitle, validateFrameDescription, validateFrameKeywords } from '@/lib/validation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FrameCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onFrameCreated: (frame: FrameWithStats) => void
}

interface FormData {
  handle: string
  title: string
  description: string
  keywords: string
  size: keyof typeof FRAME_SIZES
  permissions: 'open' | 'approval-required' | 'owner-only'
}

interface FormErrors {
  handle?: string
  title?: string
  description?: string
  keywords?: string
  general?: string
}

export function FrameCreationDialog({ isOpen, onClose, onFrameCreated }: FrameCreationDialogProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    handle: '',
    title: '',
    description: '',
    keywords: '',
    size: 'CORE_FRAME',
    permissions: 'open'
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Validate handle
    if (!validateFrameHandle(formData.handle)) {
      newErrors.handle = 'Handle must be 3-100 characters, alphanumeric, underscore, and dash only'
    }

    // Validate title
    if (!validateFrameTitle(formData.title)) {
      newErrors.title = 'Title is required and must be less than 255 characters'
    }

    // Validate description
    if (!validateFrameDescription(formData.description)) {
      newErrors.description = 'Description must be less than 1000 characters'
    }

    // Validate keywords
    const keywordArray = formData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)

    if (!validateFrameKeywords(keywordArray)) {
      newErrors.keywords = 'Keywords must be comma-separated, up to 10 keywords, each less than 50 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setErrors({ general: 'You must be logged in to create a frame' })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const selectedSize = FRAME_SIZES[formData.size]
      const keywordArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const createRequest: CreateFrameRequest = {
        handle: formData.handle,
        title: formData.title,
        description: formData.description,
        keywords: keywordArray,
        width: selectedSize.width,
        height: selectedSize.height,
        permissions: formData.permissions
      }

      const response = await fetch('/api/frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(createRequest),
      })

      const result = await response.json()

      if (result.success) {
        onFrameCreated(result.data)
        onClose()
        // Reset form
        setFormData({
          handle: '',
          title: '',
          description: '',
          keywords: '',
          size: 'CORE_FRAME',
          permissions: 'open'
        })
      } else {
        setErrors({ general: result.error || 'Failed to create frame' })
      }
    } catch (error) {
      console.error('Error creating frame:', error)
      setErrors({ general: 'Network error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }, [user, formData, validateForm, onFrameCreated, onClose])

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Frame</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Frame Handle */}
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-2">
                Frame Handle *
              </label>
              <input
                type="text"
                id="handle"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.handle ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="my-awesome-frame"
                disabled={isSubmitting}
              />
              {errors.handle && (
                <p className="mt-1 text-sm text-red-600">{errors.handle}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                3-100 characters, alphanumeric, underscore, and dash only
              </p>
            </div>

            {/* Frame Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="My Awesome Collaborative Art"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your frame's purpose and vision..."
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Optional, up to 1000 characters
              </p>
            </div>

            {/* Keywords */}
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <input
                type="text"
                id="keywords"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.keywords ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="art, collaboration, community, pixel"
                disabled={isSubmitting}
              />
              {errors.keywords && (
                <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated, up to 10 keywords for discoverability
              </p>
            </div>

            {/* Frame Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Frame Size *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(FRAME_SIZES).map(([key, size]) => (
                  <label
                    key={key}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      formData.size === key ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={key}
                      checked={formData.size === key}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{size.name}</div>
                      <div className="text-sm text-gray-500">
                        {size.width} × {size.height} - {size.description}
                      </div>
                    </div>
                    {formData.size === key && (
                      <div className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions *
              </label>
              <div className="space-y-3">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  formData.permissions === 'open' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="permissions"
                    value="open"
                    checked={formData.permissions === 'open'}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    className="mr-3"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Open</div>
                    <div className="text-sm text-gray-500">Anyone can contribute pixels</div>
                  </div>
                </label>

                <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  formData.permissions === 'approval-required' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="permissions"
                    value="approval-required"
                    checked={formData.permissions === 'approval-required'}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    className="mr-3"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Approval Required</div>
                    <div className="text-sm text-gray-500">Contributors must be approved by you</div>
                  </div>
                </label>

                <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  formData.permissions === 'owner-only' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="permissions"
                    value="owner-only"
                    checked={formData.permissions === 'owner-only'}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    className="mr-3"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Owner Only</div>
                    <div className="text-sm text-gray-500">Only you can add pixels</div>
                  </div>
                </label>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                {isSubmitting ? 'Creating...' : 'Create Frame'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}