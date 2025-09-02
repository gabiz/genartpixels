/**
 * Tests for ErrorMessage component and related utilities
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage, ErrorMessages, useErrorState } from '../error-message'

describe('ErrorMessage', () => {
  it('renders basic error message', () => {
    render(<ErrorMessage message="Test error message" />)

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(
      <ErrorMessage 
        title="Custom Title" 
        message="Test error message" 
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = jest.fn()
    
    render(
      <ErrorMessage 
        message="Test error" 
        onRetry={onRetry}
      />
    )

    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn()
    
    render(
      <ErrorMessage 
        message="Test error" 
        onDismiss={onDismiss}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    expect(dismissButton).toBeInTheDocument()

    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders custom retry label', () => {
    render(
      <ErrorMessage 
        message="Test error" 
        onRetry={() => {}}
        retryLabel="Retry Now"
      />
    )

    expect(screen.getByRole('button', { name: /retry now/i })).toBeInTheDocument()
  })

  it('shows details when provided and showDetails is true', () => {
    render(
      <ErrorMessage 
        message="Test error" 
        details="Detailed error information"
        showDetails={true}
      />
    )

    expect(screen.getByText('Technical Details')).toBeInTheDocument()
    expect(screen.getByText('Detailed error information')).toBeInTheDocument()
  })

  it('toggles details visibility when details button is clicked', () => {
    render(
      <ErrorMessage 
        message="Test error" 
        details="Detailed error information"
      />
    )

    // Details should be hidden initially
    expect(screen.queryByText('Detailed error information')).not.toBeInTheDocument()

    // Click show details
    fireEvent.click(screen.getByRole('button', { name: /show details/i }))
    expect(screen.getByText('Detailed error information')).toBeInTheDocument()

    // Click hide details
    fireEvent.click(screen.getByRole('button', { name: /hide details/i }))
    expect(screen.queryByText('Detailed error information')).not.toBeInTheDocument()
  })

  it('renders warning variant correctly', () => {
    render(
      <ErrorMessage 
        message="Warning message" 
        variant="warning"
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-warning/10')
  })

  it('renders error variant correctly (default)', () => {
    render(<ErrorMessage message="Error message" />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-destructive/10')
  })
})

describe('ErrorMessages presets', () => {
  it('renders Network error preset', () => {
    const onRetry = jest.fn()
    render(<ErrorMessages.Network onRetry={onRetry} />)

    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders NotFound error preset', () => {
    render(<ErrorMessages.NotFound resource="frame" />)

    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.getByText(/the frame you're looking for could not be found/i)).toBeInTheDocument()
  })

  it('renders PermissionDenied error preset', () => {
    render(<ErrorMessages.PermissionDenied />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/you don't have permission/i)).toBeInTheDocument()
  })

  it('renders QuotaExceeded error preset with remaining time', () => {
    render(<ErrorMessages.QuotaExceeded remainingTime={3600} />)

    expect(screen.getByText('Quota Exceeded')).toBeInTheDocument()
    expect(screen.getByText(/next refill in 60 minutes/i)).toBeInTheDocument()
  })

  it('renders QuotaExceeded error preset without remaining time', () => {
    render(<ErrorMessages.QuotaExceeded />)

    expect(screen.getByText('Quota Exceeded')).toBeInTheDocument()
    expect(screen.getByText(/please wait for your quota to refill/i)).toBeInTheDocument()
  })

  it('renders ValidationError preset', () => {
    render(<ErrorMessages.ValidationError field="handle" message="Handle is too short" />)

    expect(screen.getByText('Invalid handle')).toBeInTheDocument()
    expect(screen.getByText('Handle is too short')).toBeInTheDocument()
  })

  it('renders ServerError preset', () => {
    const onRetry = jest.fn()
    render(<ErrorMessages.ServerError onRetry={onRetry} />)

    expect(screen.getByText('Server Error')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong on our end/i)).toBeInTheDocument()
  })

  it('renders Offline error preset', () => {
    render(<ErrorMessages.Offline />)

    expect(screen.getByText("You're Offline")).toBeInTheDocument()
    expect(screen.getByText(/some features are unavailable while offline/i)).toBeInTheDocument()
  })
})

describe('useErrorState hook', () => {
  function TestComponent() {
    const { error, showError, clearError, handleApiError, ErrorComponent } = useErrorState()

    return (
      <div>
        <button onClick={() => showError('Test error')}>
          Show Error
        </button>
        <button onClick={() => showError('Warning message', { variant: 'warning' })}>
          Show Warning
        </button>
        <button onClick={() => handleApiError({ code: 'QUOTA_EXCEEDED', message: 'Quota exceeded' })}>
          API Error
        </button>
        <button onClick={clearError}>
          Clear Error
        </button>
        {ErrorComponent}
      </div>
    )
  }

  it('shows and clears errors', () => {
    render(<TestComponent />)

    // No error initially
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // Show error
    fireEvent.click(screen.getByRole('button', { name: /show error/i }))
    expect(screen.getByText('Test error')).toBeInTheDocument()

    // Clear error
    fireEvent.click(screen.getByRole('button', { name: /clear error/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows warning variant', () => {
    render(<TestComponent />)

    fireEvent.click(screen.getByRole('button', { name: /show warning/i }))
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-warning/10')
    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  it('handles API errors with specific codes', () => {
    render(<TestComponent />)

    fireEvent.click(screen.getByRole('button', { name: /api error/i }))
    
    expect(screen.getByText('Quota Exceeded')).toBeInTheDocument()
    expect(screen.getByText('Quota exceeded')).toBeInTheDocument()
  })

  it('handles unknown API errors', () => {
    function TestUnknownError() {
      const { handleApiError, ErrorComponent } = useErrorState()

      return (
        <div>
          <button onClick={() => handleApiError({ message: 'Unknown error' })}>
            Unknown Error
          </button>
          {ErrorComponent}
        </div>
      )
    }

    render(<TestUnknownError />)

    fireEvent.click(screen.getByRole('button', { name: /unknown error/i }))
    expect(screen.getByText('Unknown error')).toBeInTheDocument()
  })
})