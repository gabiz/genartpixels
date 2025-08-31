/**
 * Unit tests for ContributorManagement component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContributorManagement } from '../contributor-management'
import { useAuth } from '@/lib/auth/context'
import type { FrameWithStats, FramePermission } from '@/lib/types'

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

describe('ContributorManagement', () => {
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
    permissions: 'approval-required',
    is_frozen: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      frame_id: 'frame-1',
      contributors_count: 2,
      total_pixels: 50,
      likes_count: 5,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const mockPermissions: FramePermission[] = [
    {
      id: 'perm-1',
      frame_id: 'frame-1',
      user_handle: 'contributor1',
      permission_type: 'contributor',
      granted_by: 'frameowner',
      created_at: new Date().toISOString()
    },
    {
      id: 'perm-2',
      frame_id: 'frame-1',
      user_handle: 'pending1',
      permission_type: 'pending',
      granted_by: 'frameowner',
      created_at: new Date().toISOString()
    },
    {
      id: 'perm-3',
      frame_id: 'frame-1',
      user_handle: 'blocked1',
      permission_type: 'blocked',
      granted_by: 'frameowner',
      created_at: new Date().toISOString()
    }
  ]

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

    render(<ContributorManagement {...defaultProps} />)
    
    expect(screen.getByText('Only the frame owner can manage contributors.')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock a delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )
    
    render(<ContributorManagement {...defaultProps} />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('loads and displays permissions', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPermissions
      })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Contributor Management')).toBeInTheDocument()
      expect(screen.getByText('Invite Contributor')).toBeInTheDocument()
    })
    
    // Check sections are displayed
    expect(screen.getByText('Pending Requests (1)')).toBeInTheDocument()
    expect(screen.getByText('Contributors (1)')).toBeInTheDocument()
    expect(screen.getByText('Blocked Users (1)')).toBeInTheDocument()
    
    // Check specific users are displayed
    expect(screen.getByText('@contributor1')).toBeInTheDocument()
    expect(screen.getByText('@pending1')).toBeInTheDocument()
    expect(screen.getByText('@blocked1')).toBeInTheDocument()
  })

  it('handles invite user form submission', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    } as Response)
    
    // Mock invite user response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'perm-new',
          frame_id: 'frame-1',
          user_handle: 'newuser',
          permission_type: 'contributor',
          granted_by: 'frameowner',
          created_at: new Date().toISOString()
        }
      })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Invite Contributor')).toBeInTheDocument()
    })
    
    const handleInput = screen.getByPlaceholderText('Enter user handle')
    const inviteButton = screen.getByRole('button', { name: /invite/i })
    
    await user.type(handleInput, 'newuser')
    await user.click(inviteButton)
    
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
            targetUserHandle: 'newuser',
            permissionType: 'contributor'
          }),
        }
      )
    })
  })

  it('validates invite form input', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Invite Contributor')).toBeInTheDocument()
    })
    
    const handleInput = screen.getByPlaceholderText('Enter user handle')
    const inviteButton = screen.getByRole('button', { name: /invite/i })
    
    // Test invalid handle
    await user.type(handleInput, 'ab') // Too short
    await user.click(inviteButton)
    
    await waitFor(() => {
      expect(screen.getByText(/handle must be 5-20 characters/i)).toBeInTheDocument()
    })
  })

  it('handles approve pending request', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPermissions })
    } as Response)
    
    // Mock approve response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ...mockPermissions[1],
          permission_type: 'contributor'
        }
      })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('@pending1')).toBeInTheDocument()
    })
    
    const approveButton = screen.getByRole('button', { name: /approve/i })
    await user.click(approveButton)
    
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
            targetUserHandle: 'pending1',
            permissionType: 'contributor'
          }),
        }
      )
    })
  })

  it('handles reject pending request', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPermissions })
    } as Response)
    
    // Mock reject response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { deleted: true } })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('@pending1')).toBeInTheDocument()
    })
    
    const rejectButton = screen.getByRole('button', { name: /reject/i })
    await user.click(rejectButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/frames/${mockFrame.owner_handle}/${mockFrame.handle}/permissions?userHandle=pending1`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
    })
  })

  it('handles block contributor', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPermissions })
    } as Response)
    
    // Mock block response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ...mockPermissions[0],
          permission_type: 'blocked'
        }
      })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('@contributor1')).toBeInTheDocument()
    })
    
    // Find the block button in the contributors section specifically
    const contributorsSection = screen.getByText('Contributors (1)').parentElement!
    const blockButton = within(contributorsSection).getByRole('button', { name: 'Block' })
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
            targetUserHandle: 'contributor1',
            permissionType: 'blocked'
          }),
        }
      )
    })
  })

  it('handles unblock user', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPermissions })
    } as Response)
    
    // Mock unblock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ...mockPermissions[2],
          permission_type: 'contributor'
        }
      })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('@blocked1')).toBeInTheDocument()
    })
    
    // Find the unblock button in the blocked users section specifically
    const blockedSection = screen.getByText('Blocked Users (1)').parentElement!
    const unblockButton = within(blockedSection).getByRole('button', { name: 'Unblock' })
    await user.click(unblockButton)
    
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
            targetUserHandle: 'blocked1',
            permissionType: 'contributor'
          }),
        }
      )
    })
  })

  it('shows loading state during operations', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPermissions })
    } as Response)
    
    // Mock delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        } as Response), 100)
      )
    )
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('@contributor1')).toBeInTheDocument()
    })
    
    // Find the block button in the contributors section specifically
    const contributorsSection = screen.getByText('Contributors (1)').parentElement!
    const blockButton = within(contributorsSection).getByRole('button', { name: 'Block' })
    await user.click(blockButton)
    
    // Check loading state - should show loading spinner in the button
    expect(screen.getAllByTestId('loading-spinner')).toHaveLength(2) // Block and Remove buttons both show loading
  })

  it('handles API errors', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // Mock initial permissions load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    } as Response)
    
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'User not found'
      })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Invite Contributor')).toBeInTheDocument()
    })
    
    const handleInput = screen.getByPlaceholderText('Enter user handle')
    const inviteButton = screen.getByRole('button', { name: /invite/i })
    
    await user.type(handleInput, 'validhandle')
    await user.click(inviteButton)
    
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    } as Response)
    
    render(<ContributorManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Contributor Management')).toBeInTheDocument()
    })
    
    await user.click(screen.getByRole('button', { name: '×' }))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})