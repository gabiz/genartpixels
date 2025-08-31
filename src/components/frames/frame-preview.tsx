'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FrameWithStats } from '@/lib/types'
import { LikeButton } from './like-button'

interface FramePreviewProps {
  frame: FrameWithStats
  className?: string
}

export function FramePreview({ frame, className = '' }: FramePreviewProps) {

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Link
      href={`/${frame.owner_handle}/${frame.handle}`}
      className={`block group ${className}`}

    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
        {/* Frame Canvas Preview */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
          <div 
            className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{
              aspectRatio: `${frame.width} / ${frame.height}`,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            {/* Placeholder for actual frame preview - will be replaced with canvas rendering */}
            <div className="text-gray-400 dark:text-gray-600 text-sm font-mono">
              {frame.width}×{frame.height}
            </div>
          </div>
          
          {/* Frozen indicator */}
          {frame.is_frozen && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Frozen
            </div>
          )}
          
          {/* Permission indicator */}
          {frame.permissions !== 'open' && (
            <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
              {frame.permissions === 'approval-required' ? 'Approval' : 'Private'}
            </div>
          )}
        </div>

        {/* Frame Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
              {frame.title}
            </h3>
            <LikeButton
              frameOwnerHandle={frame.owner_handle}
              frameHandle={frame.handle}
              initialLiked={false} // We'd need to fetch this from API if user is logged in
              initialLikesCount={frame.stats.likes_count}
              size="sm"
              className="text-gray-500 dark:text-gray-400"
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {frame.description || 'No description'}
          </p>

          {/* Keywords */}
          {frame.keywords && frame.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {frame.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {frame.keywords.length > 3 && (
                <span className="inline-block text-gray-500 dark:text-gray-400 text-xs px-2 py-1">
                  +{frame.keywords.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {formatNumber(frame.stats.contributors_count)}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {formatNumber(frame.stats.total_pixels)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs">by @{frame.owner_handle}</span>
              <span className="text-xs">
                {frame.stats.last_activity ? formatTimeAgo(frame.stats.last_activity) : formatTimeAgo(frame.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}