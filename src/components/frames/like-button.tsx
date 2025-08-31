'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'

interface LikeButtonProps {
  frameOwnerHandle: string
  frameHandle: string
  initialLiked?: boolean
  initialLikesCount?: number
  className?: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LikeButton({
  frameOwnerHandle,
  frameHandle,
  initialLiked = false,
  initialLikesCount = 0,
  className = '',
  showCount = true,
  size = 'md'
}: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLikeToggle = useCallback(async () => {
    if (!user) {
      // Could show a login prompt here
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/frames/${frameOwnerHandle}/${frameHandle}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const result = await response.json()
      
      if (result.success) {
        setLiked(result.data.liked)
        setLikesCount(result.data.likesCount)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      // In a real app, you might show a toast notification
    } finally {
      setIsLoading(false)
    }
  }, [user, frameOwnerHandle, frameHandle])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  }

  return (
    <button
      onClick={handleLikeToggle}
      disabled={!user || isLoading}
      className={`
        inline-flex items-center space-x-1 rounded-lg transition-all duration-200
        ${user ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'cursor-not-allowed opacity-50'}
        ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
        ${buttonSizeClasses[size]}
        ${className}
      `}
      title={user ? (liked ? 'Unlike' : 'Like') : 'Login to like'}
    >
      <svg 
        className={`${sizeClasses[size]} transition-transform duration-200 ${isLoading ? 'animate-pulse' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={liked ? 0 : 2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
      {showCount && (
        <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {formatNumber(likesCount)}
        </span>
      )}
    </button>
  )
}