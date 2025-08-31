'use client'

/**
 * Color palette component for pixel editing
 * Displays the 32-color palette in a grid layout with selection functionality
 */

import React, { useState, useCallback, useEffect } from 'react'
import { COLOR_PALETTE } from '@/lib/types'
import { ColorUtils } from '@/lib/utils/color-utils'
import { useRovingTabindex, useScreenReaderAnnouncement } from '@/lib/hooks/use-keyboard-navigation'

export interface ColorPaletteProps {
  selectedColor?: number
  onColorSelect: (color: number) => void
  disabled?: boolean
  className?: string
  isMobile?: boolean
}

export function ColorPalette({ 
  selectedColor, 
  onColorSelect, 
  disabled = false,
  className = '',
  isMobile = false
}: ColorPaletteProps) {
  const [hoveredColor, setHoveredColor] = useState<number | null>(null)
  const announce = useScreenReaderAnnouncement()
  const gridRef = useRovingTabindex('button', !disabled)

  const handleColorClick = useCallback((color: number) => {
    if (!disabled) {
      onColorSelect(color)
      announce(`Selected ${ColorUtils.getColorName(color)} color`)
    }
  }, [disabled, onColorSelect, announce])

  const handleColorHover = useCallback((color: number | null) => {
    if (!disabled) {
      setHoveredColor(color)
    }
  }, [disabled])

  // Handle keyboard selection
  const handleKeyDown = useCallback((event: React.KeyboardEvent, color: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleColorClick(color)
    }
  }, [handleColorClick])

  const renderColorButton = (color: number, index: number) => {
    const isSelected = selectedColor === color
    const isHovered = hoveredColor === color
    const isTransparent = ColorUtils.isTransparent(color)
    const colorName = ColorUtils.getColorName(color)

    // Larger touch targets for mobile
    const sizeClass = isMobile ? 'w-12 h-12' : 'w-10 h-10'
    const scaleClass = isMobile 
      ? (isSelected ? 'scale-105' : '') 
      : (isSelected ? 'scale-110' : isHovered && !isSelected ? 'scale-105' : '')

    return (
      <button
        key={index}
        type="button"
        className={`
          relative ${sizeClass} rounded-md border-2 transition-all duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${isSelected 
            ? 'border-primary ring-2 ring-primary/20 shadow-md' 
            : 'border-border hover:border-primary/50 hover:shadow-sm'
          }
          ${scaleClass}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isTransparent ? 'bg-background' : ''}
          ${isMobile ? 'touch-manipulation' : ''}
        `}
        style={{
          backgroundColor: isTransparent ? 'transparent' : ColorUtils.argbToHexRgb(color)
        }}
        onClick={() => handleColorClick(color)}
        onMouseEnter={!isMobile ? () => handleColorHover(color) : undefined}
        onMouseLeave={!isMobile ? () => handleColorHover(null) : undefined}
        onFocus={() => handleColorHover(color)}
        onBlur={() => handleColorHover(null)}
        onKeyDown={(e) => handleKeyDown(e, color)}
        disabled={disabled}
        title={colorName}
        data-testid={`color-${color.toString(16).padStart(8, '0')}`}
        aria-label={`${colorName} color${isSelected ? ' (currently selected)' : ''}`}
        role="radio"
        aria-checked={isSelected}
      >
        {/* Transparent color indicator */}
        {isTransparent && (
          <div className="absolute inset-1 rounded">
            {/* Checkerboard pattern for transparency */}
            <div className="w-full h-full rounded" style={{
              backgroundImage: `
                linear-gradient(45deg, hsl(var(--muted-foreground)) 25%, transparent 25%), 
                linear-gradient(-45deg, hsl(var(--muted-foreground)) 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, hsl(var(--muted-foreground)) 75%), 
                linear-gradient(-45deg, transparent 75%, hsl(var(--muted-foreground)) 75%)
              `,
              backgroundSize: '6px 6px',
              backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
              opacity: 0.3
            }} />
          </div>
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-background rounded-full border-2 border-foreground shadow-sm" />
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={`color-palette ${className}`} role="group" aria-label="Color palette">
      <div className="mb-3">
        <h3 className="text-sm font-medium">Color Palette</h3>
        {hoveredColor !== null && (
          <p className="text-xs text-muted-foreground mt-1" aria-live="polite">
            {ColorUtils.getColorName(hoveredColor)}
          </p>
        )}
      </div>
      
      {/* Responsive grid layout for 32 colors */}
      <div 
        ref={gridRef}
        className={`
          grid gap-2 p-3 bg-muted/30 rounded-lg border
          ${isMobile ? 'grid-cols-6 gap-3' : 'grid-cols-8'}
        `}
        role="radiogroup"
        aria-label="Color selection"
      >
        {COLOR_PALETTE.map((color, index) => renderColorButton(color, index))}
      </div>
      
      {/* Color info */}
      {selectedColor !== undefined && (
        <div className="mt-3 p-2 bg-muted/50 rounded text-xs space-y-1">
          <div className="font-medium">
            Selected: {ColorUtils.getColorName(selectedColor)}
          </div>
          <div className="font-mono text-muted-foreground">
            {ColorUtils.argbToHex(selectedColor)}
          </div>
        </div>
      )}
    </div>
  )
}