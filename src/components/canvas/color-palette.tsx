'use client'

/**
 * Color palette component for pixel editing
 * Displays the 32-color palette in a grid layout with selection functionality
 */

import React, { useState, useCallback } from 'react'
import { COLOR_PALETTE } from '@/lib/types'
import { ColorUtils } from '@/lib/utils/color-utils'

export interface ColorPaletteProps {
  selectedColor?: number
  onColorSelect: (color: number) => void
  disabled?: boolean
  className?: string
}

export function ColorPalette({ 
  selectedColor, 
  onColorSelect, 
  disabled = false,
  className = '' 
}: ColorPaletteProps) {
  const [hoveredColor, setHoveredColor] = useState<number | null>(null)

  const handleColorClick = useCallback((color: number) => {
    if (!disabled) {
      onColorSelect(color)
    }
  }, [disabled, onColorSelect])

  const handleColorHover = useCallback((color: number | null) => {
    if (!disabled) {
      setHoveredColor(color)
    }
  }, [disabled])

  const renderColorButton = (color: number, index: number) => {
    const isSelected = selectedColor === color
    const isHovered = hoveredColor === color
    const isTransparent = ColorUtils.isTransparent(color)
    const colorName = ColorUtils.getColorName(color)

    return (
      <button
        key={index}
        type="button"
        className={`
          relative w-8 h-8 rounded border-2 transition-all duration-150 
          ${isSelected 
            ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isHovered && !isSelected ? 'scale-105' : ''}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isTransparent ? 'bg-white' : ''}
        `}
        style={{
          backgroundColor: isTransparent ? 'transparent' : ColorUtils.argbToHexRgb(color)
        }}
        onClick={() => handleColorClick(color)}
        onMouseEnter={() => handleColorHover(color)}
        onMouseLeave={() => handleColorHover(null)}
        disabled={disabled}
        title={colorName}
        data-testid={`color-${color.toString(16).padStart(8, '0')}`}
        aria-label={`Select ${colorName} color`}
      >
        {/* Transparent color indicator */}
        {isTransparent && (
          <div className="absolute inset-0 rounded">
            {/* Checkerboard pattern for transparency */}
            <div className="w-full h-full rounded" style={{
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #ccc 75%), 
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }} />
          </div>
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full border border-gray-800" />
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={`color-palette ${className}`}>
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700">Color Palette</h3>
        {hoveredColor !== null && (
          <p className="text-xs text-gray-500 mt-1">
            {ColorUtils.getColorName(hoveredColor)}
          </p>
        )}
      </div>
      
      {/* 8x4 grid layout for 32 colors */}
      <div className="grid grid-cols-8 gap-1 p-2 bg-gray-50 rounded-lg border">
        {COLOR_PALETTE.map((color, index) => renderColorButton(color, index))}
      </div>
      
      {/* Color info */}
      {selectedColor !== undefined && (
        <div className="mt-2 text-xs text-gray-600">
          <div>Selected: {ColorUtils.getColorName(selectedColor)}</div>
          <div className="font-mono">
            {ColorUtils.argbToHex(selectedColor)}
          </div>
        </div>
      )}
    </div>
  )
}