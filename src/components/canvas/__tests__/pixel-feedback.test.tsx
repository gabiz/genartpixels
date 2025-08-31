/**
 * Unit tests for PixelFeedback components and hooks
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PixelFeedbackDisplay, usePixelFeedback, PixelFeedback } from '../pixel-feedback'

// Mock timers for testing auto-expiration
jest.useFakeTimers()

describe('PixelFeedbackDisplay', () => {
  const mockOnFeedbackExpire = jest.fn()

  beforeEach(() => {
    mockOnFeedbackExpire.mockClear()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  test('renders feedback items correctly', () => {
    const feedback: PixelFeedback[] = [
      {
        id: '1',
        type: 'success',
        message: 'Pixel placed successfully'
      },
      {
        id: '2',
        type: 'error',
        message: 'Failed to place pixel'
      }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    expect(screen.getByText('Pixel placed successfully')).toBeInTheDocument()
    expect(screen.getByText('Failed to place pixel')).toBeInTheDocument()
  })

  test('displays correct icons for different feedback types', () => {
    const feedback: PixelFeedback[] = [
      { id: '1', type: 'success', message: 'Success' },
      { id: '2', type: 'error', message: 'Error' },
      { id: '3', type: 'undo', message: 'Undo' },
      { id: '4', type: 'info', message: 'Info' }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    expect(screen.getByText('✓')).toBeInTheDocument() // success
    expect(screen.getByText('✗')).toBeInTheDocument() // error
    expect(screen.getByText('↶')).toBeInTheDocument() // undo
    expect(screen.getByText('ℹ')).toBeInTheDocument() // info
  })

  test('applies correct styling for different feedback types', () => {
    const feedback: PixelFeedback[] = [
      { id: '1', type: 'success', message: 'Success' },
      { id: '2', type: 'error', message: 'Error' }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    // Find the parent container div that has the styling classes
    const successElement = screen.getByText('Success').closest('div')?.parentElement
    const errorElement = screen.getByText('Error').closest('div')?.parentElement

    expect(successElement).toHaveClass('bg-green-100', 'border-green-300', 'text-green-800')
    expect(errorElement).toHaveClass('bg-red-100', 'border-red-300', 'text-red-800')
  })

  test('displays color swatch when color is provided', () => {
    const feedback: PixelFeedback[] = [
      {
        id: '1',
        type: 'success',
        message: 'Pixel placed',
        color: 0xFFBE0039 // Red from palette
      }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    const colorSwatch = document.querySelector('[style*="background-color"]')
    expect(colorSwatch).toBeInTheDocument()
    expect(colorSwatch).toHaveAttribute('title', 'Red')
  })

  test('displays coordinates when provided', () => {
    const feedback: PixelFeedback[] = [
      {
        id: '1',
        type: 'success',
        message: 'Pixel placed',
        x: 10,
        y: 20
      }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    expect(screen.getByText('(10, 20)')).toBeInTheDocument()
  })

  test('auto-expires feedback after default duration', async () => {
    const feedback: PixelFeedback[] = [
      {
        id: '1',
        type: 'success',
        message: 'Test message'
      }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    // Should be visible initially
    expect(screen.getByText('Test message')).toBeInTheDocument()

    // Fast-forward past default duration (3000ms)
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    // Wait for fade out animation (300ms)
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(mockOnFeedbackExpire).toHaveBeenCalledWith('1')
    })
  })

  test('respects custom duration', async () => {
    const feedback: PixelFeedback[] = [
      {
        id: '1',
        type: 'success',
        message: 'Test message',
        duration: 1000 // Custom 1 second duration
      }
    ]

    render(
      <PixelFeedbackDisplay 
        feedback={feedback}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    // Fast-forward past custom duration
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Wait for fade out animation
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(mockOnFeedbackExpire).toHaveBeenCalledWith('1')
    })
  })

  test('renders empty when no feedback provided', () => {
    const { container } = render(
      <PixelFeedbackDisplay 
        feedback={[]}
        onFeedbackExpire={mockOnFeedbackExpire}
      />
    )

    expect(container.firstChild?.textContent).toBe('')
  })
})

describe('usePixelFeedback hook', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  test('initializes with empty feedback array', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    expect(result.current.feedback).toEqual([])
  })

  test('adds feedback with addFeedback', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    act(() => {
      result.current.addFeedback('success', 'Test message')
    })

    expect(result.current.feedback).toHaveLength(1)
    expect(result.current.feedback[0].type).toBe('success')
    expect(result.current.feedback[0].message).toBe('Test message')
    expect(result.current.feedback[0].id).toBeDefined()
  })

  test('adds feedback with options', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    act(() => {
      result.current.addFeedback('success', 'Pixel placed', {
        x: 10,
        y: 20,
        color: 0xFFFF0000,
        duration: 5000
      })
    })

    const feedback = result.current.feedback[0]
    expect(feedback.x).toBe(10)
    expect(feedback.y).toBe(20)
    expect(feedback.color).toBe(0xFFFF0000)
    expect(feedback.duration).toBe(5000)
  })

  test('removes feedback by id', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    act(() => {
      result.current.addFeedback('success', 'Test 1')
      result.current.addFeedback('error', 'Test 2')
    })

    expect(result.current.feedback).toHaveLength(2)
    
    const firstId = result.current.feedback[0].id
    
    act(() => {
      result.current.removeFeedback(firstId)
    })

    expect(result.current.feedback).toHaveLength(1)
    expect(result.current.feedback[0].message).toBe('Test 2')
  })

  test('clears all feedback', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    act(() => {
      result.current.addFeedback('success', 'Test 1')
      result.current.addFeedback('error', 'Test 2')
    })

    expect(result.current.feedback).toHaveLength(2)
    
    act(() => {
      result.current.clearFeedback()
    })

    expect(result.current.feedback).toHaveLength(0)
  })

  test('convenience methods work correctly', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    act(() => {
      result.current.showSuccess('Success message')
      result.current.showError('Error message')
      result.current.showUndo('Undo message')
      result.current.showInfo('Info message')
    })

    expect(result.current.feedback).toHaveLength(4)
    expect(result.current.feedback[0].type).toBe('success')
    expect(result.current.feedback[1].type).toBe('error')
    expect(result.current.feedback[2].type).toBe('undo')
    expect(result.current.feedback[3].type).toBe('info')
  })

  test('generates unique ids for feedback items', () => {
    const { result } = renderHook(() => usePixelFeedback())
    
    act(() => {
      result.current.addFeedback('success', 'Test 1')
      result.current.addFeedback('success', 'Test 2')
    })

    const ids = result.current.feedback.map(f => f.id)
    expect(ids[0]).not.toBe(ids[1])
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
  })
})