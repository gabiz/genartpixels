'use client'

import { useState, useEffect, useCallback } from 'react'
import { argbToHex } from '@/lib/utils/color-utils'

interface PixelInfo {
  x: number
  y: number
  color: number
  contributor_handle: string
  placed_at: string
  isEmpty: boolean
}

interface PixelInfoTooltipProps {
  frameOwnerHandle: string
  frameHandle: string
  x: number
  y: number
  visible: boolean
  onClose: () => void
  className?: string
}

export function PixelInfoTooltip({
  frameOwnerHandle,
  frameHandle,
  x,
  y,
  visible,
  onClose,
  className = ''
}: PixelInfoTooltipProps) {
  const [pixelInfo, setPixelInfo] = useState<PixelInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPixelInfo = useCallback(async () => {
    if (!visible) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/frames/${frameOwnerHandle}/${frameHandle}/pixel?x=${x}&y=${y}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch pixel info')
      }

      const result = await response.json()
      
      if (result.success) {
        setPixelInfo(result.data)
      } else {
        setError(result.error || 'Failed to load pixel information')
      }
    } catch (err) {
      setError('Failed to load pixel information')
      console.error('Error fetching pixel info:', err)
    } finally {
      setLoading(false)
    }
  }, [frameOwnerHandle, frameHandle, x, y, visible])

  useEffect(() => {
    if (visible) {
      fetchPixelInfo()
    } else {
      setPixelInfo(null)
      setError(null)
    }
  }, [visible, fetchPixelInfo])

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

  if (!visible) return null

  return (
    <div className={`
      absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
      rounded-lg shadow-lg p-3 z-50 min-w-[200px] max-w-[300px]
      ${className}
    `}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="pr-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Pixel ({x}, {y})
        </h4>

        {loading && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {pixelInfo && !loading && !error && (
          <div className="space-y-2">
            {pixelInfo.isEmpty ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                This pixel is empty (transparent)
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: argbToHex(pixelInfo.color) }}
                    />
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {argbToHex(pixelInfo.color)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">By:</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    @{pixelInfo.contributor_handle}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Placed:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {formatTimeAgo(pixelInfo.placed_at)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}