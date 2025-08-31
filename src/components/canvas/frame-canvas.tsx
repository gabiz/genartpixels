'use client'

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { Frame, Pixel } from '@/lib/types'
import { ColorUtils } from '@/lib/utils/color-utils'

export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

export interface CanvasInteraction {
  onPixelClick?: (x: number, y: number) => void
  onPixelHover?: (x: number, y: number) => void
  onViewportChange?: (viewport: CanvasViewport) => void
}

export interface FrameCanvasProps {
  frame: Frame
  pixels: Pixel[]
  showGrid?: boolean
  viewport?: CanvasViewport
  interaction?: CanvasInteraction
  className?: string
}

export interface FrameCanvasRef {
  fitToFrame: () => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  getPixelAtCoordinate: (clientX: number, clientY: number) => { x: number; y: number } | null
  getViewport: () => CanvasViewport
}

const DEFAULT_VIEWPORT: CanvasViewport = {
  x: 0,
  y: 0,
  zoom: 1
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 50
const ZOOM_FACTOR = 1.2

export const FrameCanvas = forwardRef<FrameCanvasRef, FrameCanvasProps>(({
  frame,
  pixels,
  showGrid = false,
  viewport = DEFAULT_VIEWPORT,
  interaction,
  className = ''
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentViewport, setCurrentViewport] = useState<CanvasViewport>(viewport)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  // Create pixel lookup map for efficient rendering
  const pixelMap = React.useMemo(() => {
    const map = new Map<string, number>()
    pixels.forEach(pixel => {
      map.set(`${pixel.x},${pixel.y}`, pixel.color)
    })
    return map
  }, [pixels])

  // Render the canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: canvasWidth, height: canvasHeight } = canvas
    const { x: panX, y: panY, zoom } = currentViewport

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Save context for transformations
    ctx.save()

    // Apply transformations
    ctx.translate(canvasWidth / 2, canvasHeight / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-frame.width / 2 + panX, -frame.height / 2 + panY)

    // Calculate visible pixel bounds for optimization
    const pixelSize = 1
    const visibleLeft = Math.floor((-panX - canvasWidth / (2 * zoom)) / pixelSize)
    const visibleRight = Math.ceil((-panX + canvasWidth / (2 * zoom)) / pixelSize)
    const visibleTop = Math.floor((-panY - canvasHeight / (2 * zoom)) / pixelSize)
    const visibleBottom = Math.ceil((-panY + canvasHeight / (2 * zoom)) / pixelSize)

    // Clamp to frame bounds
    const startX = Math.max(0, visibleLeft)
    const endX = Math.min(frame.width, visibleRight)
    const startY = Math.max(0, visibleTop)
    const endY = Math.min(frame.height, visibleBottom)

    // Render pixels
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const color = pixelMap.get(`${x},${y}`)
        if (color !== undefined && !ColorUtils.isTransparent(color)) {
          ctx.fillStyle = ColorUtils.argbToRgba(color)
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }

    // Render grid if enabled and zoom is high enough
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.lineWidth = 1 / zoom
      
      // Vertical lines
      for (let x = startX; x <= endX; x++) {
        ctx.beginPath()
        ctx.moveTo(x, startY)
        ctx.lineTo(x, endY)
        ctx.stroke()
      }
      
      // Horizontal lines
      for (let y = startY; y <= endY; y++) {
        ctx.beginPath()
        ctx.moveTo(startX, y)
        ctx.lineTo(endX, y)
        ctx.stroke()
      }
    }

    // Render frame border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.lineWidth = 2 / zoom
    ctx.strokeRect(0, 0, frame.width, frame.height)

    ctx.restore()
  }, [frame, pixelMap, currentViewport, showGrid])

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    render()
  }, [render])

  // Convert screen coordinates to pixel coordinates
  const screenToPixel = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const { x: panX, y: panY, zoom } = currentViewport

    // Convert to canvas coordinates
    const canvasX = clientX - rect.left
    const canvasY = clientY - rect.top

    // Convert to frame coordinates
    const frameX = (canvasX - rect.width / 2) / zoom - panX + frame.width / 2
    const frameY = (canvasY - rect.height / 2) / zoom - panY + frame.height / 2

    // Convert to pixel coordinates (floor to get pixel index)
    const pixelX = Math.floor(frameX)
    const pixelY = Math.floor(frameY)

    // Check bounds
    if (pixelX < 0 || pixelX >= frame.width || pixelY < 0 || pixelY >= frame.height) {
      return null
    }

    return { x: pixelX, y: pixelY }
  }, [frame, currentViewport])

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      const pixelCoord = screenToPixel(e.clientX, e.clientY)
      if (pixelCoord && interaction?.onPixelClick) {
        interaction.onPixelClick(pixelCoord.x, pixelCoord.y)
      }
    } else if (e.button === 1 || e.button === 2) { // Middle or right click for panning
      setIsDragging(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }, [screenToPixel, interaction])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y
      
      const newViewport = {
        ...currentViewport,
        x: currentViewport.x + deltaX / currentViewport.zoom,
        y: currentViewport.y + deltaY / currentViewport.zoom
      }
      
      setCurrentViewport(newViewport)
      setLastMousePos({ x: e.clientX, y: e.clientY })
      
      if (interaction?.onViewportChange) {
        interaction.onViewportChange(newViewport)
      }
    } else {
      const pixelCoord = screenToPixel(e.clientX, e.clientY)
      if (pixelCoord && interaction?.onPixelHover) {
        interaction.onPixelHover(pixelCoord.x, pixelCoord.y)
      }
    }
  }, [isDragging, lastMousePos, currentViewport, screenToPixel, interaction])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const zoomDelta = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentViewport.zoom * zoomDelta))
    
    // Zoom towards mouse position
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - rect.width / 2
      const mouseY = e.clientY - rect.top - rect.height / 2
      
      const zoomRatio = newZoom / currentViewport.zoom
      const newViewport = {
        x: currentViewport.x + mouseX * (1 - zoomRatio) / currentViewport.zoom,
        y: currentViewport.y + mouseY * (1 - zoomRatio) / currentViewport.zoom,
        zoom: newZoom
      }
      
      setCurrentViewport(newViewport)
      
      if (interaction?.onViewportChange) {
        interaction.onViewportChange(newViewport)
      }
    }
  }, [currentViewport, interaction])

  // Fit frame to canvas
  const fitToFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const padding = 20
    
    const scaleX = (rect.width - padding * 2) / frame.width
    const scaleY = (rect.height - padding * 2) / frame.height
    const zoom = Math.min(scaleX, scaleY)
    
    const newViewport = {
      x: 0,
      y: 0,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    }
    
    setCurrentViewport(newViewport)
    
    if (interaction?.onViewportChange) {
      interaction.onViewportChange(newViewport)
    }
  }, [frame, interaction])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    fitToFrame,
    setZoom: (zoom: number) => {
      const newViewport = {
        ...currentViewport,
        zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
      }
      setCurrentViewport(newViewport)
      if (interaction?.onViewportChange) {
        interaction.onViewportChange(newViewport)
      }
    },
    setPan: (x: number, y: number) => {
      const newViewport = {
        ...currentViewport,
        x,
        y
      }
      setCurrentViewport(newViewport)
      if (interaction?.onViewportChange) {
        interaction.onViewportChange(newViewport)
      }
    },
    getPixelAtCoordinate: screenToPixel,
    getViewport: () => currentViewport
  }), [currentViewport, fitToFrame, screenToPixel, interaction])

  // Update viewport when prop changes
  useEffect(() => {
    setCurrentViewport(viewport)
  }, [viewport])

  // Render when viewport or pixels change
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(render)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

  // Handle resize
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - lastMousePos.x
        const deltaY = e.clientY - lastMousePos.y
        
        const newViewport = {
          ...currentViewport,
          x: currentViewport.x + deltaX / currentViewport.zoom,
          y: currentViewport.y + deltaY / currentViewport.zoom
        }
        
        setCurrentViewport(newViewport)
        setLastMousePos({ x: e.clientX, y: e.clientY })
        
        if (interaction?.onViewportChange) {
          interaction.onViewportChange(newViewport)
        }
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, lastMousePos, currentViewport, interaction])

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
})

FrameCanvas.displayName = 'FrameCanvas'