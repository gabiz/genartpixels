'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Frame, Pixel } from '@/lib/types'
import { FrameCanvas, FrameCanvasRef, CanvasViewport, CanvasInteraction } from './frame-canvas'
import { PixelInfoTooltip } from './pixel-info-tooltip'

interface InteractiveFrameCanvasProps {
  frame: Frame
  pixels: Pixel[]
  frameOwnerHandle: string
  frameHandle: string
  showGrid?: boolean
  viewport?: CanvasViewport
  onPixelClick?: (x: number, y: number) => void
  onViewportChange?: (viewport: CanvasViewport) => void
  className?: string
  enablePixelInfo?: boolean
}

export function InteractiveFrameCanvas({
  frame,
  pixels,
  frameOwnerHandle,
  frameHandle,
  showGrid = false,
  viewport,
  onPixelClick,
  onViewportChange,
  className = '',
  enablePixelInfo = true
}: InteractiveFrameCanvasProps) {
  const canvasRef = useRef<FrameCanvasRef>(null)
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean
    x: number
    y: number
    pixelX: number
    pixelY: number
  }>({
    visible: false,
    x: 0,
    y: 0,
    pixelX: 0,
    pixelY: 0
  })

  const handlePixelClick = useCallback((pixelX: number, pixelY: number) => {
    if (onPixelClick) {
      onPixelClick(pixelX, pixelY)
    }
  }, [onPixelClick])

  const handlePixelHover = useCallback((pixelX: number, pixelY: number) => {
    if (!enablePixelInfo) return

    // Show tooltip on hover with a slight delay (desktop only)
    if (window.matchMedia('(hover: hover)').matches) {
      const timeoutId = setTimeout(() => {
        setTooltipState({
          visible: true,
          x: 0, // Will be positioned relative to cursor
          y: 0,
          pixelX,
          pixelY
        })
      }, 500) // 500ms delay

      // Clear timeout if mouse moves away quickly
      return () => clearTimeout(timeoutId)
    }
  }, [enablePixelInfo])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipState.visible) {
      // Update tooltip position to follow cursor
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipState(prev => ({
        ...prev,
        x: e.clientX - rect.left + 10, // Offset to avoid cursor overlap
        y: e.clientY - rect.top - 10
      }))
    }
  }, [tooltipState.visible])

  const handleMouseLeave = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }))
  }, [])

  const handleTooltipClose = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }))
  }, [])

  // Touch-specific handlers for mobile optimization
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent default to avoid scrolling when touching canvas
    if (e.touches.length === 1) {
      e.preventDefault()
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Handle single tap for pixel info on mobile
    if (enablePixelInfo && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const rect = e.currentTarget.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      // Show tooltip briefly on tap
      setTooltipState({
        visible: true,
        x: x + 10,
        y: y - 10,
        pixelX: Math.floor(x / 4), // Approximate pixel coordinates
        pixelY: Math.floor(y / 4)
      })
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        setTooltipState(prev => ({ ...prev, visible: false }))
      }, 2000)
    }
  }, [enablePixelInfo])

  const interaction: CanvasInteraction = {
    onPixelClick: handlePixelClick,
    onPixelHover: handlePixelHover,
    onViewportChange
  }

  return (
    <div 
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <FrameCanvas
        ref={canvasRef}
        frame={frame}
        pixels={pixels}
        showGrid={showGrid}
        viewport={viewport}
        interaction={interaction}
        className="w-full h-full"
      />
      
      {enablePixelInfo && tooltipState.visible && (
        <PixelInfoTooltip
          frameOwnerHandle={frameOwnerHandle}
          frameHandle={frameHandle}
          x={tooltipState.pixelX}
          y={tooltipState.pixelY}
          visible={tooltipState.visible}
          onClose={handleTooltipClose}
          className="pointer-events-none"
          style={{
            position: 'absolute',
            left: tooltipState.x,
            top: tooltipState.y,
            zIndex: 50
          }}
        />
      )}
    </div>
  )
}