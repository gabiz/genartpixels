'use client'

import React from 'react'
import { CanvasViewport } from './frame-canvas'

export interface CanvasControlsProps {
  viewport: CanvasViewport
  showGrid: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToFrame: () => void
  onToggleGrid: () => void
  onResetView: () => void
  className?: string
}

export function CanvasControls({
  viewport,
  showGrid,
  onZoomIn,
  onZoomOut,
  onFitToFrame,
  onToggleGrid,
  onResetView,
  className = ''
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(viewport.zoom * 100)

  return (
    <div className={`flex flex-col gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ${className}`}>
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1">
        <button
          onClick={onZoomIn}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title="Zoom In"
        >
          +
        </button>
        
        <div className="px-2 py-1 text-xs text-center text-gray-600 bg-gray-100 rounded">
          {zoomPercentage}%
        </div>
        
        <button
          onClick={onZoomOut}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* View Controls */}
      <div className="flex flex-col gap-1">
        <button
          onClick={onFitToFrame}
          className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title="Fit to Frame"
        >
          Fit
        </button>
        
        <button
          onClick={onResetView}
          className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title="Reset View"
        >
          Reset
        </button>
      </div>

      {/* Grid Toggle */}
      <button
        onClick={onToggleGrid}
        className={`px-3 py-2 text-xs font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          showGrid
            ? 'text-blue-700 bg-blue-50 border-blue-300 hover:bg-blue-100'
            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
        }`}
        title="Toggle Grid"
      >
        Grid
      </button>

      {/* Viewport Info */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div>X: {Math.round(viewport.x)}</div>
          <div>Y: {Math.round(viewport.y)}</div>
        </div>
      </div>
    </div>
  )
}