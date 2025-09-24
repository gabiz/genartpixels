'use client'

/**
 * Main frame viewer component that provides responsive layout for viewing and editing frames
 * Integrates canvas, pixel editor, social features, and frame management
 */

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FrameEvent, FrameWithStats, FramePermission, Pixel, FrameResponse } from '@/lib/types'
import { useAuth } from '@/lib/auth/context'
import { useFrameRealtime, useFrameBroadcast } from '@/lib/realtime/hooks'
import { PixelEditor } from '@/components/canvas/pixel-editor'
import { InteractiveFrameCanvas } from '@/components/canvas/interactive-frame-canvas'
import { ColorPalette } from '@/components/canvas/color-palette'
import { DetailedFrameStats } from '@/components/frames/frame-stats'
import { LikeButton } from '@/components/frames/like-button'
import { ReportButton } from '@/components/frames/report-button'
import { FrameSettingsPanel } from '@/components/frames/frame-settings-panel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FrameViewerProps {
  frame: FrameWithStats
  userPermission: FramePermission | null
  currentUserHandle: string | null
  frameOwnerHandle: string
  frameHandle: string
}

interface FrameViewerState {
  pixels: Pixel[]
  isLoading: boolean
  error: string | null
  showSettings: boolean
  isMobile: boolean
  showPixelEditor: boolean
}

export function FrameViewer({
  frame: initialFrame,
  userPermission,
  currentUserHandle,
  frameOwnerHandle,
  frameHandle
}: FrameViewerProps) {
  const router = useRouter()
  const { user } = useAuth()
  
  const [frame, setFrame] = useState<FrameWithStats>(initialFrame)
  const [state, setState] = useState<FrameViewerState>({
    pixels: [],
    isLoading: true,
    error: null,
    showSettings: false,
    isMobile: false,
    showPixelEditor: false
  })

  // Set up real-time subscription
  const { subscribe, unsubscribe } = useFrameRealtime(frame.id)
  const { broadcast, isBroadcasting, lastError } = useFrameBroadcast()

  // Check if user is frame owner
  const isOwner = currentUserHandle === frame.owner_handle

  // Check if user can edit pixels
  const canEdit = user && !frame.is_frozen && (
    isOwner ||
    frame.permissions === 'open' ||
    (frame.permissions === 'approval-required' && userPermission?.permission_type === 'contributor')
  )

  // Load frame data on mount
  useEffect(() => {
    loadFrameData()
  }, [frameOwnerHandle, frameHandle])

  // Set up mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setState(prev => ({ ...prev, isMobile: window.innerWidth < 768 }))
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const handleRealtimeEvent = (event: FrameEvent) => {
      console.log("event: ", event)
      switch (event.type) {
        case 'pixel':
          handlePixelUpdate(event.data)
          break
        case 'freeze':
          // setFrame(prev => ({ ...prev, is_frozen: event.data.isFrozen }))
          break
        case 'updateTitle':
          // setFrame(prev => ({ ...prev, title: event.data.title }))
          break
        case 'updatePermissions':
          // setFrame(prev => ({ ...prev, permissions: event.data.permissions }))
          break
        case 'delete':
          router.push('/')
          break
      }
    }

    subscribe(handleRealtimeEvent)
    
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe, router])

  const loadFrameData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch(`/api/frames/${frameOwnerHandle}/${frameHandle}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load frame')
      }
      
      const frameData: FrameResponse = result.data
      
      // Decompress and merge pixel data
      const pixels = await decompressFrameData(frameData.snapshotData, frameData.recentPixels)
      
      setState(prev => ({
        ...prev,
        pixels,
        isLoading: false
      }))
      
      // Update frame stats if they've changed
      setFrame(frameData.frame)
      
    } catch (error) {
      console.error('Error loading frame data:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load frame',
        isLoading: false
      }))
    }
  }

  const decompressFrameData = async (snapshotData: Uint8Array, recentPixels: Pixel[]): Promise<Pixel[]> => {
    // For now, just return recent pixels
    // In a full implementation, you'd decompress the snapshot and merge with recent pixels
    return recentPixels
  }

  const handlePixelUpdate = (pixel: Pixel) => {
    setState(prev => ({
      ...prev,
      pixels: prev.pixels.filter(p => !(p.x === pixel.x && p.y === pixel.y)).concat(pixel)
    }))
    
    // Update frame stats
    setFrame(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        total_pixels: (prev.stats.total_pixels || 0) + 1,
        last_activity: new Date().toISOString()
      }
    }))
  }

  const handlePixelPlaced = useCallback((pixel: Pixel) => {
    handlePixelUpdate(pixel)

    const pixelEvent: FrameEvent = {
      type: 'pixel',
      data: pixel
    }

    try {
      broadcast(pixelEvent)
      .then(result => {
        console.log(`Broadcasted pixel at (${pixel.x}, ${pixel.y})`)
      })
      .catch(error => {
        console.error("Error:", error);
      });
    } catch (error) {
      console.log(`Failed to broadcast pixel: ${error}`)
    }
  }, [])

  const handlePixelClick = useCallback((x: number, y: number) => {
    // This would typically trigger the pixel editor or placement logic
    // For now, we'll just log the coordinates
    console.log('Pixel clicked at:', x, y)
  }, [])

  const handlePixelUndone = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      pixels: prev.pixels.filter(p => !(p.x === x && p.y === y))
    }))
    
    // Update frame stats
    setFrame(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        total_pixels: Math.max(0, (prev.stats.total_pixels || 0) - 1),
        last_activity: new Date().toISOString()
      }
    }))
  }, [])

  const handleFrameUpdate = useCallback((updatedFrame: Partial<FrameWithStats>) => {
    setFrame(prev => ({ ...prev, ...updatedFrame }))
  }, [])

  const handleShareFrame = useCallback(async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${frameOwnerHandle}/${frameHandle}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: frame.title,
          text: frame.description || `Check out "${frame.title}" by @${frame.owner_handle}`,
          url
        })
      } catch (error) {
        // User cancelled or share failed, fall back to clipboard
        await navigator.clipboard.writeText(url)
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url)
      // Could show a toast notification here
    }
  }, [frameOwnerHandle, frameHandle, frame.title, frame.description, frame.owner_handle])

  const togglePixelEditor = useCallback(() => {
    setState(prev => ({ ...prev, showPixelEditor: !prev.showPixelEditor }))
  }, [])

  const toggleSettings = useCallback(() => {
    setState(prev => ({ ...prev, showSettings: !prev.showSettings }))
  }, [])

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Frame
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{state.error}</p>
          <button
            onClick={loadFrameData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Frame title and owner */}
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {frame.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  by 
                  <Link
                    href={`/${frame.owner_handle}`}
                    className="px-1 text-blue-600"
                  >
                    @{frame.owner_handle}
                 </Link>                 
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Social actions */}
              <LikeButton
                frameOwnerHandle={frameOwnerHandle}
                frameHandle={frameHandle}
                initialLikesCount={frame.stats.likes_count || 0}
                size={state.isMobile ? 'sm' : 'md'}
              />
              
              <ReportButton
                frameOwnerHandle={frameOwnerHandle}
                frameHandle={frameHandle}
                frameTitle={frame.title}
                size={state.isMobile ? 'sm' : 'md'}
              />

              {/* Share button */}
              <button
                onClick={handleShareFrame}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Share frame"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>

              {/* Mobile pixel editor toggle */}
              {state.isMobile && canEdit && (
                <button
                  onClick={togglePixelEditor}
                  className={`p-2 rounded-lg transition-colors ${
                    state.showPixelEditor
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Toggle pixel editor"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}

              {/* Settings button (owner only) */}
              {isOwner && (
                <button
                  onClick={toggleSettings}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Frame settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Canvas and editor */}
            <div className="lg:col-span-3">
              {canEdit ? (
                <PixelEditor
                  frame={frame}
                  pixels={state.pixels}
                  onPixelPlaced={handlePixelPlaced}
                  onPixelUndone={handlePixelUndone}
                  showColorPalette={state.showPixelEditor}
                  className="w-full h-full"
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <InteractiveFrameCanvas
                    frame={frame}
                    pixels={state.pixels}
                    frameOwnerHandle={frameOwnerHandle}
                    frameHandle={frameHandle}
                    showGrid={false}
                    className="w-full h-96"
                  />
                  {!user && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <p className="text-blue-700 dark:text-blue-300">
                        <a href={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-medium hover:underline">
                          Sign in
                        </a>{' '}
                        to start placing pixels and collaborating!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Frame description */}
              {frame.description && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {frame.description}
                  </p>
                </div>
              )}

              {/* Keywords */}
              {frame.keywords && frame.keywords.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {frame.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Frame stats */}
              <DetailedFrameStats frame={frame} />

            </div>
          </div>
      </main>

      {/* Settings panel (owner only) */}
      {isOwner && state.showSettings && (
        <FrameSettingsPanel
          frame={frame}
          onFrameUpdated={handleFrameUpdate}
          onClose={toggleSettings}
        />
      )}
    </div>
  )
}