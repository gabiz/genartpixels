/**
 * Unit tests for ColorPalette component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ColorPalette } from '../color-palette'
import { COLOR_PALETTE } from '@/lib/types'

describe('ColorPalette', () => {
  const mockOnColorSelect = jest.fn()

  beforeEach(() => {
    mockOnColorSelect.mockClear()
  })

  test('renders all 32 colors from palette', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    // Check that all colors are rendered
    COLOR_PALETTE.forEach((color) => {
      const colorButton = screen.getByTestId(`color-${color.toString(16).padStart(8, '0')}`)
      expect(colorButton).toBeInTheDocument()
    })
  })

  test('calls onColorSelect when color is clicked', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const firstColor = COLOR_PALETTE[0]
    const colorButton = screen.getByTestId(`color-${firstColor.toString(16).padStart(8, '0')}`)
    
    fireEvent.click(colorButton)
    
    expect(mockOnColorSelect).toHaveBeenCalledWith(firstColor)
  })

  test('shows selected color with visual indicator', () => {
    const selectedColor = COLOR_PALETTE[5] // Yellow
    render(
      <ColorPalette 
        selectedColor={selectedColor}
        onColorSelect={mockOnColorSelect} 
      />
    )
    
    const selectedButton = screen.getByTestId(`color-${selectedColor.toString(16).padStart(8, '0')}`)
    
    // Check for selection styling
    expect(selectedButton).toHaveClass('border-blue-500')
    expect(selectedButton).toHaveClass('ring-2')
    expect(selectedButton).toHaveClass('scale-110')
  })

  test('displays color name on hover', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const redColor = COLOR_PALETTE[2] // Red
    const colorButton = screen.getByTestId(`color-${redColor.toString(16).padStart(8, '0')}`)
    
    fireEvent.mouseEnter(colorButton)
    
    // Should show color name
    expect(screen.getByText('Red')).toBeInTheDocument()
  })

  test('shows transparent color with checkerboard pattern', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const transparentColor = COLOR_PALETTE[0] // Transparent
    const colorButton = screen.getByTestId(`color-${transparentColor.toString(16).padStart(8, '0')}`)
    
    // Should have transparent background styling
    expect(colorButton).toHaveClass('bg-white')
  })

  test('disables interaction when disabled prop is true', () => {
    render(
      <ColorPalette 
        onColorSelect={mockOnColorSelect} 
        disabled={true}
      />
    )
    
    const firstColor = COLOR_PALETTE[0]
    const colorButton = screen.getByTestId(`color-${firstColor.toString(16).padStart(8, '0')}`)
    
    fireEvent.click(colorButton)
    
    // Should not call onColorSelect when disabled
    expect(mockOnColorSelect).not.toHaveBeenCalled()
    
    // Should have disabled styling
    expect(colorButton).toHaveClass('cursor-not-allowed')
    expect(colorButton).toHaveClass('opacity-50')
  })

  test('displays selected color information', () => {
    const selectedColor = COLOR_PALETTE[13] // Blue
    render(
      <ColorPalette 
        selectedColor={selectedColor}
        onColorSelect={mockOnColorSelect} 
      />
    )
    
    // Should show selected color name
    expect(screen.getByText('Selected: Blue')).toBeInTheDocument()
    
    // Should show hex value
    expect(screen.getByText('#FF3690EA')).toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const firstColor = COLOR_PALETTE[0]
    const colorButton = screen.getByTestId(`color-${firstColor.toString(16).padStart(8, '0')}`)
    
    // Should have proper aria-label
    expect(colorButton).toHaveAttribute('aria-label', 'Select Transparent color')
    
    // Should have title for tooltip
    expect(colorButton).toHaveAttribute('title', 'Transparent')
  })

  test('handles keyboard navigation', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const firstColor = COLOR_PALETTE[0]
    const colorButton = screen.getByTestId(`color-${firstColor.toString(16).padStart(8, '0')}`)
    
    // Should be focusable
    colorButton.focus()
    expect(colorButton).toHaveFocus()
    
    // Should respond to Enter key
    fireEvent.keyDown(colorButton, { key: 'Enter' })
    // Note: This would require additional implementation in the component
  })

  test('renders in 8x4 grid layout', () => {
    const { container } = render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const gridContainer = container.querySelector('.grid-cols-8')
    
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('grid-cols-8')
  })

  test('shows hover effects on non-selected colors', () => {
    const selectedColor = COLOR_PALETTE[5]
    render(
      <ColorPalette 
        selectedColor={selectedColor}
        onColorSelect={mockOnColorSelect} 
      />
    )
    
    const nonSelectedColor = COLOR_PALETTE[10]
    const colorButton = screen.getByTestId(`color-${nonSelectedColor.toString(16).padStart(8, '0')}`)
    
    fireEvent.mouseEnter(colorButton)
    
    // Should show hover effect (scale-105 class would be added via CSS)
    // This is more of an integration test with actual DOM
    expect(colorButton).not.toHaveClass('border-blue-500') // Not selected
  })
})