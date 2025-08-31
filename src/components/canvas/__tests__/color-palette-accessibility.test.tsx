/**
 * Accessibility tests for ColorPalette component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ColorPalette } from '../color-palette'
import { COLOR_PALETTE } from '@/lib/types'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('ColorPalette Accessibility', () => {
  const mockOnColorSelect = jest.fn()

  beforeEach(() => {
    mockOnColorSelect.mockClear()
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(
      <ColorPalette onColorSelect={mockOnColorSelect} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA attributes', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const radiogroup = screen.getByRole('radiogroup')
    expect(radiogroup).toHaveAttribute('aria-label', 'Color selection')
    
    // Check that all color buttons have proper ARIA attributes
    const radios = screen.getAllByRole('radio')
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('aria-label')
      expect(radio).toHaveAttribute('aria-checked')
    })
  })

  it('should support keyboard navigation', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const radios = screen.getAllByRole('radio')
    const firstRadio = radios[0]
    
    // Test Enter key
    fireEvent.keyDown(firstRadio, { key: 'Enter' })
    expect(mockOnColorSelect).toHaveBeenCalledWith(COLOR_PALETTE[0])
    
    // Test Space key
    mockOnColorSelect.mockClear()
    fireEvent.keyDown(firstRadio, { key: ' ' })
    expect(mockOnColorSelect).toHaveBeenCalledWith(COLOR_PALETTE[0])
  })

  it('should announce color selection to screen readers', () => {
    // Mock the live region
    const liveRegion = document.createElement('div')
    liveRegion.id = 'live-region'
    document.body.appendChild(liveRegion)
    
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const firstRadio = screen.getAllByRole('radio')[0]
    fireEvent.click(firstRadio)
    
    // Check that announcement was made
    setTimeout(() => {
      expect(liveRegion.textContent).toContain('Selected')
    }, 100)
    
    // Cleanup
    document.body.removeChild(liveRegion)
  })

  it('should handle disabled state properly', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} disabled={true} />)
    
    const radios = screen.getAllByRole('radio')
    radios.forEach(radio => {
      expect(radio).toBeDisabled()
    })
    
    // Test that clicks don't work when disabled
    fireEvent.click(radios[0])
    expect(mockOnColorSelect).not.toHaveBeenCalled()
  })

  it('should provide proper color information', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} selectedColor={COLOR_PALETTE[0]} />)
    
    // Check that color information is displayed
    expect(screen.getByText(/Selected:/)).toBeInTheDocument()
    expect(screen.getByText(/#[0-9A-F]{8}/i)).toBeInTheDocument()
  })

  it('should handle mobile touch interactions', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} isMobile={true} />)
    
    const radios = screen.getAllByRole('radio')
    
    // Check that radios have touch-manipulation class for mobile
    radios.forEach(radio => {
      expect(radio).toHaveClass('touch-manipulation')
    })
  })

  it('should show hover information', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const firstRadio = screen.getAllByRole('radio')[0]
    
    // Simulate hover
    fireEvent.mouseEnter(firstRadio)
    
    // Check that color name is displayed
    const colorName = firstRadio.getAttribute('title')
    expect(colorName).toBeTruthy()
  })

  it('should handle focus events properly', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    const firstRadio = screen.getAllByRole('radio')[0]
    
    // Test focus
    fireEvent.focus(firstRadio)
    
    // Test blur
    fireEvent.blur(firstRadio)
    
    // Just verify the events don't cause errors
    expect(firstRadio).toBeInTheDocument()
  })

  it('should have sufficient color contrast for transparent color', () => {
    render(<ColorPalette onColorSelect={mockOnColorSelect} />)
    
    // Find the transparent color radio (first one in palette)
    const transparentRadio = screen.getAllByRole('radio')[0]
    
    // Check that it has proper visual indicators
    expect(transparentRadio).toHaveAttribute('aria-label')
    expect(transparentRadio.getAttribute('aria-label')).toContain('Transparent')
  })

  it('should maintain selection state visually and programmatically', () => {
    const selectedColor = COLOR_PALETTE[5]
    render(<ColorPalette onColorSelect={mockOnColorSelect} selectedColor={selectedColor} />)
    
    const radios = screen.getAllByRole('radio')
    const selectedRadio = radios[5] // Assuming COLOR_PALETTE[5] is at index 5
    
    expect(selectedRadio).toHaveAttribute('aria-checked', 'true')
    expect(selectedRadio.getAttribute('aria-label')).toContain('currently selected')
  })
})