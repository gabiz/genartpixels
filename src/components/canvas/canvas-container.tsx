'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Frame, Pixel } from '@/lib/types'
import { FrameCanvas, FrameCanvasRef, CanvasViewport, CanvasInteraction } from './frame-canvas'
import { CanvasControls } from './canvas-controls'

export interface CanvasContainerProps {
  frame: Frame
  pixels: Pixel[]
  onPixelClick?: (x: number, y: number) => void
  onPixelHover?: (x: number, y: number) => void
  className?: string
  showControls?: boolean
}

const DEFAULT_VIEWPORT: CanvasViewport = {
  x: 0,
  y: 0,
  zoom: 1
}

const ZOOM_FACTOR = 1.2
const MIN_ZOOM = 0.1
const MAX_ZOOM = 50

export function CanvasContainer({
  frame,
  pixels,
  onPixelClick,
  onPixelHover,
  className = '',
  showControls = true
}: CanvasContainerProps) {
  const canvasRef = useRef<FrameCanvasRef>(null)
  const [viewport, setViewport] = useState<CanvasViewport>(DEFAULT_VIEWPORT)
  const [showGrid, setShowGrid] = useState(false)

  const handleViewportChange = useCallback((newViewport: CanvasViewport) => {
    setViewport(newViewport)
  }, [])

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(MAX_ZOOM, viewport.zoom * ZOOM_FACTOR)
    canvasRef.current?.setZoom(newZoom)
  }, [viewport.zoom])

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, viewport.zoom / ZOOM_FACTOR)
    canvasRef.current?.setZoom(newZoom)
  }, [viewport.zoom])

  const handleFitToFrame = useCallback(() => {
    canvasRef.current?.fitToFrame()
  }, [])

  const handleResetView = useCallback(() => {
    canvasRef.current?.setPan(0, 0)
    canvasRef.current?.setZoom(1)
  }, [])

  const handleToggleGrid = useCallback(() => {
    setShowGrid(prev => !prev)
  }, [])

  const interaction: CanvasInteraction = {
    onPixelClick,
    onPixelHover,
    onViewportChange: handleViewportChange
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <FrameCanvas
        ref={canvasRef}
        frame={frame}
        pixels={pixels}
        showGrid={showGrid}
        viewport={viewport}
        interaction={interaction}
        className="w-full h-full"
      />
      
      {showControls && (
        <div className="absolute top-4 right-4 z-10">
          <CanvasControls
            viewport={viewport}
            showGrid={showGrid}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToFrame={handleFitToFrame}
            onToggleGrid={handleToggleGrid}
            onResetView={handleResetView}
          />
        </div>
      )}
    </div>
  )
}