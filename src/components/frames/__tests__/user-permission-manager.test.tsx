/**
 * Unit tests for UserPermissionManager component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserPermissionManager } from '../user-permission-manager'
import { useAuth } from '@/lib/auth/context'
import type { FrameWithStats } from '@/lib/types'

// Mock the auth context
jest.mock('@/lib/auth/context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

// Mock LoadingSpinner
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ size, className }: { size?: string; className?: string }) => (
    <div data-testid="loading-spinner" data-size={size} className={className}>Loading...</div>
  )
}))

describe('UserPermissionManager', () => {
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

  it('renders user management interface for owner', () => {
    render(<UserPermissionManager {...defaultProps} />)
    
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Block User' })).toBeInTheDocument()
    expect(screen.getByText('Remove User Contributions')).toBeInTheDocument()
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
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

    render(<UserPermissionManager {...defaultProps} />)
    
    expect(screen.getByText('Only the frame owner can manage users.')).toBeInTheDocument()
  })

  it('displays block user form', () => {
    render(<UserPermissionManager {...defaultProps} />)
    
    expect(screen.getByText('Blocked users cannot place pixels on this frame. Existing pixels remain.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter user handle to block')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /block user/i })).toBeInTheDocument()
  })

  it('displays remove contributions form', () => {
    render(<UserPermissionManager {...defaultProps} />)
    
    expect(screen.getByText('Remove all pixels placed by a specific user. This action cannot be undone.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter user handle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove contributions/i })).toBeInTheDocument()
  })

  it('validates block user form', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getByPlaceholderText('Enter user handle to block')
    const blockButton = screen.getByRole('button', { name: /block user/i })
    
    // Test invalid handle (too short)
    await user.type(handleInput, 'ab')
    await user.click(blockButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 5-20 characters/i)).toBeInTheDocument()
    })
  })

  it('prevents blocking frame owner', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getByPlaceholderText('Enter user handle to block')
    const blockButton = screen.getByRole('button', { name: /block user/i })
    
    await user.type(handleInput, 'frameowner')
    await user.click(blockButton)
    
    await waitFor(() => {
      expect(screen.getByText('Cannot block the frame owner')).toBeInTheDocument()
    })
  })

  it('handles block user submission', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'perm-1',
          frame_id: 'frame-1',
          user_handle: 'baduser',
          permission_type: 'blocked',
          granted_by: 'frameowner',
          created_at: new Date().toISOString()
        }
      })
    } as Response)
    
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getByPlaceholderText('Enter user handle to block')
    const blockButton = screen.getByRole('button', { name: /block user/i })
    
    await user.type(handleInput, 'baduser')
    await user.click(blockButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/frames/${mockFrame.owner_handle}/${mockFrame.handle}/permissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            targetUserHandle: 'baduser',
            permissionType: 'blocked'
          }),
        }
      )
    })
    
    expect(screen.getByText('User @baduser has been blocked from this frame')).toBeInTheDocument()
  })

  it('validates remove contributions form', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getAllByPlaceholderText('Enter user handle')[0] // Second form
    const removeButton = screen.getByRole('button', { name: /remove contributions/i })
    
    // Test invalid handle (too short)
    await user.type(handleInput, 'ab')
    await user.click(removeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 5-20 characters/i)).toBeInTheDocument()
    })
  })

  it('prevents removing contributions from frame owner', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getAllByPlaceholderText('Enter user handle')[0] // Second form
    const removeButton = screen.getByRole('button', { name: /remove contributions/i })
    
    await user.type(handleInput, 'frameowner')
    await user.click(removeButton)
    
    await waitFor(() => {
      expect(screen.getByText('Cannot remove contributions from the frame owner')).toBeInTheDocument()
    })
  })

  it('handles remove contributions submission (shows not implemented)', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getAllByPlaceholderText('Enter user handle')[0] // Second form
    const removeButton = screen.getByRole('button', { name: /remove contributions/i })
    
    await user.type(handleInput, 'someuser')
    await user.click(removeButton)
    
    await waitFor(() => {
      expect(screen.getByText('This feature is not yet implemented')).toBeInTheDocument()
    })
  })

  it('shows loading state during block operation', async () => {
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
    
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getByPlaceholderText('Enter user handle to block')
    const blockButton = screen.getByRole('button', { name: /block user/i })
    
    await user.type(handleInput, 'testuser')
    await user.click(blockButton)
    
    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Blocking...')).toBeInTheDocument()
    expect(blockButton).toBeDisabled()
  })

  it('shows loading state during remove operation', async () => {
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
    
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getAllByPlaceholderText('Enter user handle')[0] // Second form
    const removeButton = screen.getByRole('button', { name: /remove contributions/i })
    
    await user.type(handleInput, 'testuser')
    await user.click(removeButton)
    
    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Removing...')).toBeInTheDocument()
    expect(removeButton).toBeDisabled()
  })

  it('handles API errors for block operation', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'User not found'
      })
    } as Response)
    
    render(<UserPermissionManager {...defaultProps} />)
    
    const handleInput = screen.getByPlaceholderText('Enter user handle to block')
    const blockButton = screen.getByRole('button', { name: /block user/i })
    
    await user.type(handleInput, 'nonexistent')
    await user.click(blockButton)
    
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('disables buttons when forms are empty', () => {
    render(<UserPermissionManager {...defaultProps} />)
    
    const blockButton = screen.getByRole('button', { name: /block user/i })
    const removeButton = screen.getByRole('button', { name: /remove contributions/i })
    
    expect(blockButton).toBeDisabled()
    expect(removeButton).toBeDisabled()
  })

  it('enables buttons when forms have valid input', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    const blockHandleInput = screen.getByPlaceholderText('Enter user handle to block')
    const removeHandleInput = screen.getAllByPlaceholderText('Enter user handle')[0]
    const blockButton = screen.getByRole('button', { name: /block user/i })
    const removeButton = screen.getByRole('button', { name: /remove contributions/i })
    
    await user.type(blockHandleInput, 'validuser')
    await user.type(removeHandleInput, 'validuser')
    
    expect(blockButton).not.toBeDisabled()
    expect(removeButton).not.toBeDisabled()
  })

  it('displays quick actions buttons', () => {
    render(<UserPermissionManager {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /manage contributors/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /frame settings/i })).toBeInTheDocument()
  })

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: '×' }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<UserPermissionManager {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /close/i }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})