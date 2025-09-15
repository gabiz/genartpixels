'use client'

/**
 * Pixel editor component that integrates canvas, color palette, and editing functionality
 * Provides complete pixel editing experience with quota management and visual feedback
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Frame, Pixel, PlacePixelRequest, PlacePixelResponse } from '@/lib/types'
import { ColorUtils } from '@/lib/utils/color-utils'
import { useAuth } from '@/lib/auth/context'
import { FrameCanvas, FrameCanvasRef, CanvasViewport } from './frame-canvas'
import { ColorPalette } from './color-palette'
import { QuotaDisplay } from './quota-display'
import { PixelFeedbackDisplay, usePixelFeedback } from './pixel-feedback'

export interface PixelEditorProps {
  frame: Frame
  pixels: Pixel[]
  onPixelPlaced?: (pixel: Pixel) => void
  onPixelUndone?: (x: number, y: number) => void
  className?: string
  showColorPalette: boolean
}

export interface PixelEditorState {
  selectedColor: number
  showGrid: boolean
  isPlacing: boolean
  lastPlacedPixel: { x: number; y: number; color: number } | null
  userQuota: number
  lastRefill: string
}

export function PixelEditor({ 
  frame, 
  pixels, 
  onPixelPlaced, 
  onPixelUndone,
  className = '',
  showColorPalette
}: PixelEditorProps) {
  const { user, refreshUser } = useAuth()
  const canvasRef = useRef<FrameCanvasRef>(null)
  const feedback = usePixelFeedback()

  const [state, setState] = useState<PixelEditorState>({
    selectedColor: 0xFF000000, // Default to black
    showGrid: true,
    isPlacing: false,
    lastPlacedPixel: null,
    userQuota: user?.pixels_available || 0,
    lastRefill: user?.last_refill || new Date().toISOString(),
  })

  const [viewport, setViewport] = useState<CanvasViewport>({
    x: 0,
    y: 0,
    zoom: 1
  })

  // Update quota when user data changes
  useEffect(() => {
    if (user) {
      setState(prev => ({
        ...prev,
        userQuota: user.pixels_available,
        lastRefill: user.last_refill
      }))
    }
  }, [user])

  // Handle color selection
  const handleColorSelect = useCallback((color: number) => {
    setState(prev => ({ ...prev, selectedColor: color }))
    feedback.showInfo(`Selected ${ColorUtils.getColorName(color)}`)
  }, [feedback])

  // Handle grid toggle
  const handleGridToggle = useCallback(() => {
    setState(prev => ({ ...prev, showGrid: !prev.showGrid }))
  }, [])

  // Handle pixel placement
  const handlePixelClick = useCallback(async (x: number, y: number) => {
    if (!user) {
      feedback.showError('Please log in to place pixels')
      return
    }

    if (state.isPlacing) {
      return // Prevent double-clicking
    }

    // Check if pixel already has the same color
    const existingPixel = pixels.find(p => p.x === x && p.y === y)
    if (existingPixel && existingPixel.color === state.selectedColor) {
      feedback.showInfo('Pixel already has this color', { x, y, color: state.selectedColor })
      return
    }

    setState(prev => ({ ...prev, isPlacing: true }))

    try {
      const request: PlacePixelRequest = {
        frameId: frame.id,
        x,
        y,
        color: state.selectedColor
      }

      const response = await fetch('/api/pixels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      })

      const result: PlacePixelResponse = await response.json()

      if (result.success && result.pixel) {
        // Update local state
        setState(prev => ({
          ...prev,
          userQuota: result.quotaRemaining,
          lastPlacedPixel: { x, y, color: state.selectedColor }
        }))

        // Show success feedback
        feedback.showSuccess(
          `Pixel placed! ${result.quotaRemaining} remaining`,
          { x, y, color: state.selectedColor }
        )

        // Notify parent component
        if (onPixelPlaced) {
          onPixelPlaced(result.pixel)
        }

        // Refresh user data to sync quota
        refreshUser()
      } else {
        // Handle errors
        const errorMessage = result.error || 'Failed to place pixel'
        if (errorMessage.includes('quota') || errorMessage.includes('pixels remaining')) {
          feedback.showError('No pixels remaining! Wait for refill.')
        } else if (errorMessage.includes('frozen')) {
          feedback.showError('This frame is frozen')
        } else if (errorMessage.includes('permission')) {
          feedback.showError('You don\'t have permission to edit this frame')
        } else {
          feedback.showError(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error placing pixel:', error)
      feedback.showError('Network error occurred')
    } finally {
      setState(prev => ({ ...prev, isPlacing: false }))
    }
  }, [user, state.isPlacing, state.selectedColor, pixels, frame.id, feedback, onPixelPlaced, refreshUser])

  // Handle undo functionality
  const handleUndo = useCallback(async () => {
    if (!user || !state.lastPlacedPixel) {
      feedback.showError('No pixel to undo')
      return
    }

    try {
      const response = await fetch('/api/pixels', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ frameId: frame.id })
      })

      const result = await response.json()

      if (result.success) {
        const { x, y, color } = result.undonePixel
        
        // Update local state
        setState(prev => ({
          ...prev,
          userQuota: result.quotaRemaining,
          lastPlacedPixel: null
        }))

        // Show undo feedback
        feedback.showUndo(
          `Pixel undone! ${result.quotaRemaining} pixels available`,
          { x, y, color }
        )

        // Notify parent component
        if (onPixelUndone) {
          onPixelUndone(x, y)
        }

        // Refresh user data
        refreshUser()
      } else {
        feedback.showError(result.error || 'Failed to undo pixel')
      }
    } catch (error) {
      console.error('Error undoing pixel:', error)
      feedback.showError('Network error occurred')
    }
  }, [user, state.lastPlacedPixel, frame.id, feedback, onPixelUndone, refreshUser])

  // Handle viewport changes
  const handleViewportChange = useCallback((newViewport: CanvasViewport) => {
    setViewport(newViewport)
  }, [])

  // Fit canvas to frame
  const handleFitToFrame = useCallback(() => {
    canvasRef.current?.fitToFrame()
  }, [])

  // Handle pixel hover for preview
  const handlePixelHover = useCallback((x: number, y: number) => {
    // Could show preview or coordinate info here
  }, [])

  const canEditPixels = user && !frame.is_frozen && state.userQuota > 0

  return (
    <div className={`pixel-editor ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Canvas area */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Canvas controls */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGridToggle}
                className={`
                  px-3 py-1 text-sm rounded border transition-colors
                  ${state.showGrid 
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                  }
                `}
              >
                {state.showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
              
              <button
                onClick={handleFitToFrame}
                className="px-3 py-1 text-sm rounded border bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              >
                Fit to Frame
              </button>

              {state.lastPlacedPixel && (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1 text-sm rounded border bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                >
                  Undo Last Pixel
                </button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              Zoom: {Math.round(viewport.zoom * 100)}%
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
            <FrameCanvas
              ref={canvasRef}
              frame={frame}
              pixels={pixels}
              showGrid={state.showGrid}
              viewport={viewport}
              interaction={{
                onPixelClick: canEditPixels ? handlePixelClick : undefined,
                onPixelHover: handlePixelHover,
                onViewportChange: handleViewportChange
              }}
              className="w-full h-full"
            />
          </div>

          {/* Status bar */}
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>
                Frame: {frame.width}×{frame.height} • 
                Pixels: {pixels.length}
              </span>
              <span>
                {canEditPixels ? 'Click to place pixels' : 
                 !user ? 'Log in to edit' :
                 frame.is_frozen ? 'Frame is frozen' :
                 'No pixels remaining'}
              </span>
            </div>
          </div>
        </div>

        {/* Editing panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Color palette */}
          {!(window.innerWidth < 768 && !showColorPalette) && (
            <ColorPalette
              selectedColor={state.selectedColor}
              onColorSelect={handleColorSelect}
              disabled={!canEditPixels}
              isMobile={window.innerWidth < 768}
            />
          )}

          {/* Quota display */}
          {user && (
            <QuotaDisplay
              currentQuota={state.userQuota}
              lastRefill={state.lastRefill}
            />
          )}

          {/* Feedback display */}
          {/* <PixelFeedbackDisplay
            feedback={feedback.feedback}
            onFeedbackExpire={feedback.removeFeedback}
          /> */}

          {/* Frame info */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-medium text-gray-700 mb-2">Frame Info</h4>
            <div className="space-y-1 text-gray-600">
              <div>Owner: {frame.owner_handle}</div>
              <div>Size: {frame.width}×{frame.height}</div>
              <div>Permissions: {frame.permissions}</div>
              <div>Status: {frame.is_frozen ? 'Frozen' : 'Active'}</div>
            </div>
          </div>

          {/* Help text */}
          {!user && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <div className="font-medium mb-1">Get Started</div>
              <div>Log in to start placing pixels and collaborating!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}