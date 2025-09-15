/**
 * Unit tests for QuotaDisplay component
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QuotaDisplay } from '../quota-display'

// Mock timers for testing countdown
jest.useFakeTimers()

describe('QuotaDisplay', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  test('displays current quota correctly', () => {
    const currentQuota = 75
    const lastRefill = new Date().toISOString()
    
    render(
      <QuotaDisplay 
        currentQuota={currentQuota}
        lastRefill={lastRefill}
      />
    )
    
    expect(screen.getByText('75/100')).toBeInTheDocument()
  })

  test('shows correct quota status for different levels', () => {
    // Test full quota
    const { rerender } = render(
      <QuotaDisplay 
        currentQuota={100}
        lastRefill={new Date().toISOString()}
      />
    )
    expect(screen.getByText('Quota full')).toBeInTheDocument()
    
    // Test high quota
    rerender(
      <QuotaDisplay 
        currentQuota={80}
        lastRefill={new Date().toISOString()}
      />
    )
    expect(screen.getByText('Quota high')).toBeInTheDocument()
    
    // Test medium quota
    rerender(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={new Date().toISOString()}
      />
    )
    expect(screen.getByText('Quota medium')).toBeInTheDocument()
    
    // Test low quota
    rerender(
      <QuotaDisplay 
        currentQuota={20}
        lastRefill={new Date().toISOString()}
      />
    )
    expect(screen.getByText('Quota low')).toBeInTheDocument()
    
    // Test empty quota
    rerender(
      <QuotaDisplay 
        currentQuota={0}
        lastRefill={new Date().toISOString()}
      />
    )
    expect(screen.getByText('No pixels available')).toBeInTheDocument()
  })

  test('displays progress bar with correct width', () => {
    render(
      <QuotaDisplay 
        currentQuota={75}
        lastRefill={new Date().toISOString()}
      />
    )
    
    const progressBar = document.querySelector('.h-2.rounded-full:not(.bg-gray-200)')
    expect(progressBar).toHaveStyle('width: 75%')
  })

  test('shows correct progress bar color based on quota level', () => {
    // Test green for high quota
    const { rerender } = render(
      <QuotaDisplay 
        currentQuota={75}
        lastRefill={new Date().toISOString()}
      />
    )
    let progressBar = document.querySelector('.h-2.rounded-full:not(.bg-gray-200)')
    expect(progressBar).toHaveClass('bg-green-500')
    
    // Test yellow for medium quota
    rerender(
      <QuotaDisplay 
        currentQuota={40}
        lastRefill={new Date().toISOString()}
      />
    )
    progressBar = document.querySelector('.h-2.rounded-full:not(.bg-gray-200)')
    expect(progressBar).toHaveClass('bg-yellow-500')
    
    // Test red for low quota
    rerender(
      <QuotaDisplay 
        currentQuota={10}
        lastRefill={new Date().toISOString()}
      />
    )
    progressBar = document.querySelector('.h-2.rounded-full:not(.bg-gray-200)')
    expect(progressBar).toHaveClass('bg-red-500')
  })

  test('shows countdown timer for next refill', () => {
    // Set last refill to 30 minutes ago
    const lastRefill = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={lastRefill}
      />
    )
    
    expect(screen.getByText('Next refill:')).toBeInTheDocument()
    expect(screen.getByText('30:00')).toBeInTheDocument() // Should show remaining time
  })

  test('updates countdown timer every second', () => {
    // Set last refill to 30 minutes ago
    const lastRefill = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={lastRefill}
      />
    )
    
    // Initial state
    expect(screen.getByText('30:00')).toBeInTheDocument()
    
    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    // Should update countdown
    expect(screen.getByText('29:59')).toBeInTheDocument()
  })

  test('shows "Ready for refill" when time has passed', () => {
    // Set last refill to 2 hours ago
    const lastRefill = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={lastRefill}
      />
    )
    
    expect(screen.getByText('Ready for refill')).toBeInTheDocument()
  })

  test('shows full quota message when quota is at maximum', () => {
    render(
      <QuotaDisplay 
        currentQuota={100}
        lastRefill={new Date().toISOString()}
      />
    )
    
    expect(screen.getByText('✓ Quota is full')).toBeInTheDocument()
  })

  test('displays next refill time in readable format', () => {
    // Set last refill to 30 minutes ago
    const lastRefill = new Date(Date.now() - 30 * 60 * 1000)
    const nextRefill = new Date(lastRefill.getTime() + 60 * 60 * 1000)
    
    render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={lastRefill.toISOString()}
      />
    )
    
    const expectedTime = nextRefill.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    expect(screen.getByText(expectedTime)).toBeInTheDocument()
  })

  test('includes quota explanation', () => {
    render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={new Date().toISOString()}
      />
    )
    
    expect(screen.getByText('How it works:')).toBeInTheDocument()
    expect(screen.getByText('• You get 100 pixels per hour')).toBeInTheDocument()
    expect(screen.getByText('• Quota refills automatically')).toBeInTheDocument()
  })

  test('handles Date object as lastRefill prop', () => {
    const lastRefill = new Date()
    
    render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={lastRefill}
      />
    )
    
    // Should not throw error and should render
    expect(screen.getByText('50/100')).toBeInTheDocument()
  })

  test('cleans up timer on unmount', () => {
    const { unmount } = render(
      <QuotaDisplay 
        currentQuota={50}
        lastRefill={new Date().toISOString()}
      />
    )
    
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    
    clearIntervalSpy.mockRestore()
  })
})