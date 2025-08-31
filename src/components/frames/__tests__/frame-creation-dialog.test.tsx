/**
 * Unit tests for FrameCreationDialog component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FrameCreationDialog } from '../frame-creation-dialog'
import { useAuth } from '@/lib/auth/context'
import { FRAME_SIZES } from '@/lib/types'

// Mock the auth context
jest.mock('@/lib/auth/context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

// Mock LoadingSpinner
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div data-testid="loading-spinner" className={className}>Loading...</div>
  )
}))

describe('FrameCreationDialog', () => {
  const mockUser = {
    id: 'user-1',
    handle: 'testuser',
    email: 'test@example.com',
    pixels_available: 100,
    last_refill: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onFrameCreated: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      supabaseUser: null,
      loading: false,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn(),
      refreshUser: jest.fn()
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders when open', () => {
    render(<FrameCreationDialog {...defaultProps} />)
    
    expect(screen.getByText('Create New Frame')).toBeInTheDocument()
    expect(screen.getByLabelText(/frame handle/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<FrameCreationDialog {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Create New Frame')).not.toBeInTheDocument()
  })

  it('displays all frame size options', () => {
    render(<FrameCreationDialog {...defaultProps} />)
    
    Object.values(FRAME_SIZES).forEach(size => {
      expect(screen.getByText(size.name)).toBeInTheDocument()
      expect(screen.getByText(`${size.width} × ${size.height} - ${size.description}`)).toBeInTheDocument()
    })
  })

  it('displays all permission options', () => {
    render(<FrameCreationDialog {...defaultProps} />)
    
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Anyone can contribute pixels')).toBeInTheDocument()
    expect(screen.getByText('Approval Required')).toBeInTheDocument()
    expect(screen.getByText('Contributors must be approved by you')).toBeInTheDocument()
    expect(screen.getByText('Owner Only')).toBeInTheDocument()
    expect(screen.getByText('Only you can add pixels')).toBeInTheDocument()
  })

  it('validates form inputs', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create frame/i })
    
    // Try to submit empty form
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 3-100 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('validates handle format', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    const handleInput = screen.getByLabelText(/frame handle/i)
    const submitButton = screen.getByRole('button', { name: /create frame/i })
    
    // Test invalid handle (too short)
    await user.type(handleInput, 'ab')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 3-100 characters/i)).toBeInTheDocument()
    })
    
    // Test invalid handle (special characters)
    await user.clear(handleInput)
    await user.type(handleInput, 'invalid@handle')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 3-100 characters/i)).toBeInTheDocument()
    })
  })

  it('validates title requirement', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    const titleInput = screen.getByLabelText(/title/i)
    const submitButton = screen.getByRole('button', { name: /create frame/i })
    
    // Leave title empty
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('validates keywords format', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    const handleInput = screen.getByLabelText(/frame handle/i)
    const titleInput = screen.getByLabelText(/title/i)
    const keywordsInput = screen.getByLabelText(/keywords/i)
    const submitButton = screen.getByRole('button', { name: /create frame/i })
    
    // Fill required fields
    await user.type(handleInput, 'valid-handle')
    await user.type(titleInput, 'Valid Title')
    
    // Test too many keywords (more than 10)
    const manyKeywords = Array.from({ length: 12 }, (_, i) => `keyword${i}`).join(', ')
    await user.type(keywordsInput, manyKeywords)
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Keywords must be comma-separated, up to 10 keywords/i)).toBeInTheDocument()
    })
  })

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    const handleInput = screen.getByLabelText(/frame handle/i)
    const submitButton = screen.getByRole('button', { name: /create frame/i })
    
    // Trigger validation error
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 3-100 characters/i)).toBeInTheDocument()
    })
    
    // Start typing to clear error
    await user.type(handleInput, 'valid-handle')
    
    await waitFor(() => {
      expect(screen.queryByText(/handle must be 3-100 characters/i)).not.toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'frame-1',
          handle: 'test-frame',
          title: 'Test Frame',
          description: 'Test description',
          keywords: ['test', 'frame'],
          owner_handle: 'testuser',
          width: 128,
          height: 128,
          permissions: 'open',
          is_frozen: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          stats: {
            frame_id: 'frame-1',
            contributors_count: 0,
            total_pixels: 0,
            likes_count: 0,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      })
    } as Response)
    
    render(<FrameCreationDialog {...defaultProps} />)
    
    // Fill form
    await user.type(screen.getByLabelText(/frame handle/i), 'test-frame')
    await user.type(screen.getByLabelText(/title/i), 'Test Frame')
    await user.type(screen.getByLabelText(/description/i), 'Test description')
    await user.type(screen.getByLabelText(/keywords/i), 'test, frame')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create frame/i }))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          handle: 'test-frame',
          title: 'Test Frame',
          description: 'Test description',
          keywords: ['test', 'frame'],
          width: 128,
          height: 128,
          permissions: 'open'
        }),
      })
    })
    
    expect(defaultProps.onFrameCreated).toHaveBeenCalled()
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('handles API errors', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Frame handle already exists'
      })
    } as Response)
    
    render(<FrameCreationDialog {...defaultProps} />)
    
    // Fill form
    await user.type(screen.getByLabelText(/frame handle/i), 'existing-frame')
    await user.type(screen.getByLabelText(/title/i), 'Test Frame')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create frame/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Frame handle already exists')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock a delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        } as Response), 100)
      )
    )
    
    render(<FrameCreationDialog {...defaultProps} />)
    
    // Fill form
    await user.type(screen.getByLabelText(/frame handle/i), 'test-frame')
    await user.type(screen.getByLabelText(/title/i), 'Test Frame')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create frame/i }))
    
    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    
    // Form should be disabled
    expect(screen.getByLabelText(/frame handle/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('requires authentication', async () => {
    const user = userEvent.setup()
    
    // Mock no user
    mockUseAuth.mockReturnValue({
      user: null,
      supabaseUser: null,
      loading: false,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn(),
      refreshUser: jest.fn()
    })
    
    render(<FrameCreationDialog {...defaultProps} />)
    
    // Fill form
    await user.type(screen.getByLabelText(/frame handle/i), 'test-frame')
    await user.type(screen.getByLabelText(/title/i), 'Test Frame')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create frame/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/you must be logged in/i)).toBeInTheDocument()
    })
  })

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: '×' }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('closes dialog when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<FrameCreationDialog {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})