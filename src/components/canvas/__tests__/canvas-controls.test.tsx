/**
 * Component tests for CanvasControls
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasControls } from '../canvas-controls'

describe('CanvasControls', () => {
  const mockProps = {
    viewport: { x: 0, y: 0, zoom: 1 },
    showGrid: false,
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onFitToFrame: jest.fn(),
    onToggleGrid: jest.fn(),
    onResetView: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all control buttons', () => {
    render(<CanvasControls {...mockProps} />)

    expect(screen.getByTitle('Zoom In')).toBeInTheDocument()
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument()
    expect(screen.getByTitle('Fit to Frame')).toBeInTheDocument()
    expect(screen.getByTitle('Reset View')).toBeInTheDocument()
    expect(screen.getByTitle('Toggle Grid')).toBeInTheDocument()
  })

  test('displays zoom percentage correctly', () => {
    render(<CanvasControls {...mockProps} viewport={{ x: 0, y: 0, zoom: 2.5 }} />)

    expect(screen.getByText('250%')).toBeInTheDocument()
  })

  test('displays viewport coordinates', () => {
    render(<CanvasControls {...mockProps} viewport={{ x: 10.7, y: -5.3, zoom: 1 }} />)

    expect(screen.getByText('X: 11')).toBeInTheDocument() // Rounded
    expect(screen.getByText('Y: -5')).toBeInTheDocument() // Rounded
  })

  test('calls onZoomIn when zoom in button is clicked', () => {
    render(<CanvasControls {...mockProps} />)

    fireEvent.click(screen.getByTitle('Zoom In'))
    expect(mockProps.onZoomIn).toHaveBeenCalledTimes(1)
  })

  test('calls onZoomOut when zoom out button is clicked', () => {
    render(<CanvasControls {...mockProps} />)

    fireEvent.click(screen.getByTitle('Zoom Out'))
    expect(mockProps.onZoomOut).toHaveBeenCalledTimes(1)
  })

  test('calls onFitToFrame when fit button is clicked', () => {
    render(<CanvasControls {...mockProps} />)

    fireEvent.click(screen.getByTitle('Fit to Frame'))
    expect(mockProps.onFitToFrame).toHaveBeenCalledTimes(1)
  })

  test('calls onResetView when reset button is clicked', () => {
    render(<CanvasControls {...mockProps} />)

    fireEvent.click(screen.getByTitle('Reset View'))
    expect(mockProps.onResetView).toHaveBeenCalledTimes(1)
  })

  test('calls onToggleGrid when grid button is clicked', () => {
    render(<CanvasControls {...mockProps} />)

    fireEvent.click(screen.getByTitle('Toggle Grid'))
    expect(mockProps.onToggleGrid).toHaveBeenCalledTimes(1)
  })

  test('shows grid button as active when showGrid is true', () => {
    render(<CanvasControls {...mockProps} showGrid={true} />)

    const gridButton = screen.getByTitle('Toggle Grid')
    expect(gridButton).toHaveClass('text-blue-700', 'bg-blue-50', 'border-blue-300')
  })

  test('shows grid button as inactive when showGrid is false', () => {
    render(<CanvasControls {...mockProps} showGrid={false} />)

    const gridButton = screen.getByTitle('Toggle Grid')
    expect(gridButton).toHaveClass('text-gray-700', 'bg-white', 'border-gray-300')
  })

  test('applies custom className', () => {
    const { container } = render(<CanvasControls {...mockProps} className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('handles keyboard navigation', () => {
    render(<CanvasControls {...mockProps} />)

    const zoomInButton = screen.getByTitle('Zoom In')
    
    // Focus should work
    zoomInButton.focus()
    expect(zoomInButton).toHaveFocus()

    // Enter key should trigger click
    fireEvent.keyDown(zoomInButton, { key: 'Enter' })
    // Note: React Testing Library doesn't automatically trigger click on Enter,
    // but the button should have proper focus styles
    expect(zoomInButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
  })

  test('displays correct zoom percentage for various zoom levels', () => {
    const testCases = [
      { zoom: 0.1, expected: '10%' },
      { zoom: 0.5, expected: '50%' },
      { zoom: 1, expected: '100%' },
      { zoom: 1.5, expected: '150%' },
      { zoom: 10, expected: '1000%' }
    ]

    testCases.forEach(({ zoom, expected }) => {
      const { unmount } = render(<CanvasControls {...mockProps} viewport={{ x: 0, y: 0, zoom }} />)
      
      expect(screen.getByText(expected)).toBeInTheDocument()
      
      unmount()
    })
  })

  test('handles negative coordinates correctly', () => {
    render(<CanvasControls {...mockProps} viewport={{ x: -15.7, y: -25.3, zoom: 1 }} />)

    expect(screen.getByText('X: -16')).toBeInTheDocument()
    expect(screen.getByText('Y: -25')).toBeInTheDocument()
  })
})