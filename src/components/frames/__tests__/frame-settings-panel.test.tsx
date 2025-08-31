/**
 * Unit tests for FrameSettingsPanel component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FrameSettingsPanel } from '../frame-settings-panel'
import { useAuth } from '@/lib/auth/context'
import type { FrameWithStats } from '@/lib/types'

// Mock the auth context
jest.mock('@/lib/auth/context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

// Mock LoadingSpinner
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}))

describe('FrameSettingsPanel', () => {
  const mockUser = {
    id: 'user-1',
    handle: 'frameowner',
    email: 'owner@example.com',
    pixels_available: 100,
    last_refill: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockFrame: FrameWithStats = {
    id: 'frame-1',
    handle: 'test-frame',
    title: 'Test Frame',
    description: 'Test description',
    keywords: ['test', 'frame'],
    owner_handle: 'frameowner',
    width: 128,
    height: 128,
    permissions: 'open',
    is_frozen: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      frame_id: 'frame-1',
      contributors_count: 5,
      total_pixels: 100,
      likes_count: 10,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const defaultProps = {
    frame: mockFrame,
    onFrameUpdated: jest.fn(),
    onClose: jest.fn()
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

  it('renders frame settings for owner', () => {
    render(<FrameSettingsPanel {...defaultProps} />)
    
    expect(screen.getByText('Frame Settings')).toBeInTheDocument()
    expect(screen.getByText('Frame Status')).toBeInTheDocument()
    expect(screen.getByText('Permissions')).toBeInTheDocument()
    expect(screen.getByText('Statistics')).toBeInTheDocument()
  })

  it('shows access denied for non-owners', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, handle: 'otheruser' },
      supabaseUser: null,
      loading: false,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn(),
      refreshUser: jest.fn()
    })

    render(<FrameSettingsPanel {...defaultProps} />)
    
    expect(screen.getByText('Only the frame owner can access settings.')).toBeInTheDocument()
  })

  it('displays frame status correctly', () => {
    render(<FrameSettingsPanel {...defaultProps} />)
    
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Contributors can place pixels')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /freeze/i })).toBeInTheDocument()
  })

  it('displays frozen status correctly', () => {
    const frozenFrame = { ...mockFrame, is_frozen: true }
    render(<FrameSettingsPanel {...defaultProps} frame={frozenFrame} />)
    
    expect(screen.getByText('Frozen')).toBeInTheDocument()
    expect(screen.getByText('No new pixels can be placed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unfreeze/i })).toBeInTheDocument()
  })

  it('displays all permission options', () => {
    render(<FrameSettingsPanel {...defaultProps} />)
    
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Anyone can contribute')).toBeInTheDocument()
    expect(screen.getByText('Approval Required')).toBeInTheDocument()
    expect(screen.getByText('You approve contributors')).toBeInTheDocument()
    expect(screen.getByText('Owner Only')).toBeInTheDocument()
    expect(screen.getByText('Only you can contribute')).toBeInTheDocument()
  })

  it('shows current permission selected', () => {
    render(<FrameSettingsPanel {...defaultProps} />)
    
    const openRadio = screen.getByDisplayValue('open')
    expect(openRadio).toBeChecked()
  })

  it('displays frame statistics', () => {
    render(<FrameSettingsPanel {...defaultProps} />)
    
    expect(screen.getByText('100')).toBeInTheDocument() // total_pixels
    expect(screen.getByText('5')).toBeInTheDocument() // contributors_count
    expect(screen.getByText('10')).toBeInTheDocument() // likes_count
    expect(screen.getByText('Pixels')).toBeInTheDocument()
    expect(screen.getByText('Contributors')).toBeInTheDocument()
    expect(screen.getByText('Likes')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('handles freeze toggle', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockFrame, is_frozen: true }
      })
    } as Response)
    
    render(<FrameSettingsPanel {...defaultProps} />)
    
    const freezeButton = screen.getByRole('button', { name: /freeze/i })
    await user.click(freezeButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/frames/${mockFrame.owner_handle}/${mockFrame.handle}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ is_frozen: true }),
        }
      )
    })
    
    expect(defaultProps.onFrameUpdated).toHaveBeenCalled()
  })

  it('handles unfreeze toggle', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    const frozenFrame = { ...mockFrame, is_frozen: true }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...frozenFrame, is_frozen: false }
      })
    } as Response)
    
    render(<FrameSettingsPanel {...defaultProps} frame={frozenFrame} />)
    
    const unfreezeButton = screen.getByRole('button', { name: /unfreeze/i })
    await user.click(unfreezeButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/frames/${frozenFrame.owner_handle}/${frozenFrame.handle}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ is_frozen: false }),
        }
      )
    })
    
    expect(defaultProps.onFrameUpdated).toHaveBeenCalled()
  })

  it('handles permission changes', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockFrame, permissions: 'approval-required' }
      })
    } as Response)
    
    render(<FrameSettingsPanel {...defaultProps} />)
    
    const approvalRadio = screen.getByDisplayValue('approval-required')
    await user.click(approvalRadio)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/frames/${mockFrame.owner_handle}/${mockFrame.handle}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ permissions: 'approval-required' }),
        }
      )
    })
    
    expect(defaultProps.onFrameUpdated).toHaveBeenCalled()
  })

  it('shows loading state during updates', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock a delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: mockFrame })
        } as Response), 100)
      )
    )
    
    render(<FrameSettingsPanel {...defaultProps} />)
    
    const freezeButton = screen.getByRole('button', { name: /freeze/i })
    await user.click(freezeButton)
    
    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    
    // Buttons should be disabled
    expect(screen.getByRole('button', { name: '×' })).toBeDisabled()
  })

  it('handles API errors', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Permission denied'
      })
    } as Response)
    
    render(<FrameSettingsPanel {...defaultProps} />)
    
    const freezeButton = screen.getByRole('button', { name: /freeze/i })
    await user.click(freezeButton)
    
    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument()
    })
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<FrameSettingsPanel {...defaultProps} />)
    
    const freezeButton = screen.getByRole('button', { name: /freeze/i })
    await user.click(freezeButton)
    
    await waitFor(() => {
      expect(screen.getByText('Network error occurred. Please try again.')).toBeInTheDocument()
    })
  })

  it('closes panel when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<FrameSettingsPanel {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: '×' }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('closes panel when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<FrameSettingsPanel {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /close/i }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})