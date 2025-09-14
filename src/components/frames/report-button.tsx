'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'

interface ReportButtonProps {
  frameOwnerHandle: string
  frameHandle: string
  frameTitle: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface ReportReason {
  value: string
  label: string
  description: string
}

const REPORT_REASONS: ReportReason[] = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Contains offensive, explicit, or inappropriate imagery'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Repetitive, promotional, or low-quality content'
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Targets or harasses individuals or groups'
  },
  {
    value: 'copyright_violation',
    label: 'Copyright Violation',
    description: 'Uses copyrighted material without permission'
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    description: 'Contains hateful or discriminatory content'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other violation not listed above'
  }
]

export function ReportButton({
  frameOwnerHandle,
  frameHandle,
  frameTitle,
  className = '',
  size = 'md'
}: ReportButtonProps) {
  const { user } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReported, setIsReported] = useState(false)

  const handleReport = useCallback(async () => {
    if (!user || !selectedReason) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/frames/${frameOwnerHandle}/${frameHandle}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: selectedReason,
          description: description.trim() || undefined
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setIsReported(true)
        setShowDialog(false)
        // Reset form
        setSelectedReason('')
        setDescription('')
      } else {
        // Handle error - in a real app, show a toast notification
        console.error('Report failed:', result.error)
      }
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [user, frameOwnerHandle, frameHandle, selectedReason, description])

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  }

  if (isReported) {
    return (
      <div className={`inline-flex items-center text-green-600 dark:text-green-400 ${className}`}>
        <svg className={sizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="ml-1 text-sm">Reported</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={!user}
        className={`
          inline-flex items-center rounded-lg transition-all duration-200
          ${user ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400' : 'cursor-not-allowed opacity-50'}
          ${buttonSizeClasses[size]}
          ${className}
        `}
        title={user ? 'Report this frame' : 'Login to report'}
      >
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </button>

      {/* Report Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Report Frame
                </h3>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You are reporting &quot;{frameTitle}&quot; by @{frameOwnerHandle}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for reporting
                  </label>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((reason) => (
                      <label key={reason.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {reason.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {reason.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {description.length}/500 characters
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!selectedReason || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}