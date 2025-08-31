'use client'

/**
 * Pixel placement feedback component
 * Shows visual feedback for pixel placement, errors, and undo actions
 */

import React, { useEffect, useState } from 'react'
import { ColorUtils } from '@/lib/utils/color-utils'

export type FeedbackType = 'success' | 'error' | 'undo' | 'info'

export interface PixelFeedback {
  id: string
  type: FeedbackType
  message: string
  x?: number
  y?: number
  color?: number
  duration?: number
}

export interface PixelFeedbackProps {
  feedback: PixelFeedback[]
  onFeedbackExpire: (id: string) => void
  className?: string
}

export function PixelFeedbackDisplay({ 
  feedback, 
  onFeedbackExpire, 
  className = '' 
}: PixelFeedbackProps) {
  return (
    <div className={`pixel-feedback-display ${className}`}>
      {feedback.length > 0 && (
        <div className="space-y-2">
          {feedback.map((item) => (
            <FeedbackItem
              key={item.id}
              feedback={item}
              onExpire={() => onFeedbackExpire(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FeedbackItemProps {
  feedback: PixelFeedback
  onExpire: () => void
}

function FeedbackItem({ feedback, onExpire }: FeedbackItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const duration = feedback.duration || 3000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onExpire, 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [feedback.duration, onExpire])

  const getIcon = () => {
    switch (feedback.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'undo':
        return '↶'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  const getColorClasses = () => {
    switch (feedback.type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'undo':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'info':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  return (
    <div
      className={`
        px-3 py-2 rounded-lg border text-sm transition-all duration-300
        ${getColorClasses()}
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
      `}
    >
      <div className="flex items-center space-x-2">
        <span className="font-medium">{getIcon()}</span>
        <span className="flex-1">{feedback.message}</span>
        
        {/* Show color swatch for pixel-related feedback */}
        {feedback.color !== undefined && (
          <div className="flex items-center space-x-1">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{
                backgroundColor: ColorUtils.isTransparent(feedback.color) 
                  ? 'transparent' 
                  : ColorUtils.argbToHexRgb(feedback.color)
              }}
              title={ColorUtils.getColorName(feedback.color)}
            />
          </div>
        )}
        
        {/* Show coordinates for pixel-related feedback */}
        {feedback.x !== undefined && feedback.y !== undefined && (
          <span className="text-xs font-mono opacity-75">
            ({feedback.x}, {feedback.y})
          </span>
        )}
      </div>
    </div>
  )
}

// Hook for managing feedback state
export function usePixelFeedback() {
  const [feedback, setFeedback] = useState<PixelFeedback[]>([])

  const addFeedback = (
    type: FeedbackType,
    message: string,
    options?: {
      x?: number
      y?: number
      color?: number
      duration?: number
    }
  ) => {
    const newFeedback: PixelFeedback = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      message,
      ...options
    }

    setFeedback(prev => [...prev, newFeedback])
  }

  const removeFeedback = (id: string) => {
    setFeedback(prev => prev.filter(item => item.id !== id))
  }

  const clearFeedback = () => {
    setFeedback([])
  }

  // Convenience methods
  const showSuccess = (message: string, options?: Parameters<typeof addFeedback>[2]) => {
    addFeedback('success', message, options)
  }

  const showError = (message: string, options?: Parameters<typeof addFeedback>[2]) => {
    addFeedback('error', message, options)
  }

  const showUndo = (message: string, options?: Parameters<typeof addFeedback>[2]) => {
    addFeedback('undo', message, options)
  }

  const showInfo = (message: string, options?: Parameters<typeof addFeedback>[2]) => {
    addFeedback('info', message, options)
  }

  return {
    feedback,
    addFeedback,
    removeFeedback,
    clearFeedback,
    showSuccess,
    showError,
    showUndo,
    showInfo
  }
}