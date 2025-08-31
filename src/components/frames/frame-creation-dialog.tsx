'use client'

/**
 * Frame creation dialog component
 * Allows users to create new frames with size selection and metadata inputs
 */

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import { FRAME_SIZES, type FrameSize, type CreateFrameRequest, type FrameWithStats } from '@/lib/types'
import { validateFrameHandle, validateFrameTitle, validateFrameDescription, validateFrameKeywords } from '@/lib/validation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogBody,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertCircleIcon } from '@/components/ui/alert'

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Frame</DialogTitle>
          <DialogDescription>
            Set up your collaborative pixel art canvas with custom settings and permissions.
          </DialogDescription>
        </DialogHeader>
        <DialogClose onClose={onClose} />

        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Frame Handle */}
            <Input
              label="Frame Handle *"
              id="handle"
              value={formData.handle}
              onChange={(e) => handleInputChange('handle', e.target.value)}
              placeholder="my-awesome-frame"
              disabled={isSubmitting}
              error={!!errors.handle}
              helperText={errors.handle || "3-100 characters, alphanumeric, underscore, and dash only"}
            />

            {/* Frame Title */}
            <Input
              label="Title *"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="My Awesome Collaborative Art"
              disabled={isSubmitting}
              error={!!errors.title}
              helperText={errors.title}
            />

            {/* Description */}
            <Textarea
              label="Description"
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Describe your frame's purpose and vision..."
              disabled={isSubmitting}
              error={!!errors.description}
              helperText={errors.description || "Optional, up to 1000 characters"}
            />

            {/* Keywords */}
            <Input
              label="Keywords"
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="art, collaboration, community, pixel"
              disabled={isSubmitting}
              error={!!errors.keywords}
              helperText={errors.keywords || "Comma-separated, up to 10 keywords for discoverability"}
            />

            {/* Frame Size */}
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">
                Frame Size *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(FRAME_SIZES).map(([key, size]) => (
                  <label
                    key={key}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent ${
                      formData.size === key ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
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
                      <div className="font-medium">{size.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {size.width} × {size.height} - {size.description}
                      </div>
                    </div>
                    {formData.size === key && (
                      <div className="text-primary">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">
                Permissions *
              </label>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent ${
                  formData.permissions === 'open' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                }`}>
                  <input
                    type="radio"
                    name="permissions"
                    value="open"
                    checked={formData.permissions === 'open'}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium">Open</div>
                    <div className="text-sm text-muted-foreground">Anyone can contribute pixels</div>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent ${
                  formData.permissions === 'approval-required' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                }`}>
                  <input
                    type="radio"
                    name="permissions"
                    value="approval-required"
                    checked={formData.permissions === 'approval-required'}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium">Approval Required</div>
                    <div className="text-sm text-muted-foreground">Contributors must be approved by you</div>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent ${
                  formData.permissions === 'owner-only' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                }`}>
                  <input
                    type="radio"
                    name="permissions"
                    value="owner-only"
                    checked={formData.permissions === 'owner-only'}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium">Owner Only</div>
                    <div className="text-sm text-muted-foreground">Only you can add pixels</div>
                  </div>
                </label>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
          </form>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Creating...' : 'Create Frame'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}