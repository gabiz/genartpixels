/**
 * Unit tests for UserSettings component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserSettings } from '../user-settings'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/supabase/client'

// Mock the auth context
jest.mock('@/lib/auth/context', () => ({
  useAuth: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

const mockUser = {
  id: 'test-user-id',
  handle: 'test_user',
  email: 'test@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  pixels_available: 75,
  last_refill: '2024-01-01T12:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
}

const mockRefreshUser = jest.fn()
const mockSignOut = jest.fn()

describe('UserSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuth as jest.Mock).mockReturnValue({
      refreshUser: mockRefreshUser,
      signOut: mockSignOut,
    })

    // Default mock that returns success
    const mockSupabaseChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain)
  })

  test('renders user settings with profile information', () => {
    render(<UserSettings user={mockUser} />)

    expect(screen.getByText('Profile Information')).toBeInTheDocument()
    expect(screen.getByText('test_user')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
  })

  test('displays user avatar when available', () => {
    render(<UserSettings user={mockUser} />)

    const avatar = screen.getByAltText('Profile picture')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  test('displays fallback avatar when no avatar URL', () => {
    const userWithoutAvatar = { ...mockUser, avatar_url: undefined }
    render(<UserSettings user={userWithoutAvatar} />)

    expect(screen.getByText('T')).toBeInTheDocument() // First letter of handle
  })

  test('shows pixel quota information', () => {
    render(<UserSettings user={mockUser} />)

    expect(screen.getByText('Pixel Quota')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument() // Available pixels
    expect(screen.getByText('/ 100')).toBeInTheDocument()
  })

  test('displays quota progress bar correctly', () => {
    render(<UserSettings user={mockUser} />)

    // Find the progress bar div by its style
    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle({ width: '75%' })
  })

  test('removes avatar successfully', async () => {
    const user = userEvent.setup()
    const mockEq = jest.fn().mockResolvedValue({ error: null })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    })

    render(<UserSettings user={mockUser} />)

    const removeButton = screen.getByText('Remove Avatar')
    await user.click(removeButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: '' })
      expect(screen.getByText('Avatar updated successfully!')).toBeInTheDocument()
    })
  })

  test('handles avatar update error', async () => {
    const user = userEvent.setup()
    const mockEq = jest.fn().mockResolvedValue({ 
      error: { message: 'Database error' } 
    })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    })

    render(<UserSettings user={mockUser} />)

    const removeButton = screen.getByText('Remove Avatar')
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update avatar')).toBeInTheDocument()
    })
  })

  test('disables remove avatar button when no avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatar_url: undefined }
    render(<UserSettings user={userWithoutAvatar} />)

    const removeButton = screen.getByText('Remove Avatar')
    expect(removeButton).toBeDisabled()
  })

  test('shows loading state during avatar update', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: any) => void
    const mockEq = jest.fn().mockImplementation(() => 
      new Promise(resolve => {
        resolvePromise = resolve
      })
    )
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    })

    render(<UserSettings user={mockUser} />)

    const removeButton = screen.getByText('Remove Avatar')
    
    // Start the click but don't await it yet
    user.click(removeButton)

    // Check loading state immediately
    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument()
    })
    expect(removeButton).toBeDisabled()

    // Resolve the promise
    resolvePromise!({ error: null })
  })

  test('signs out successfully', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue(undefined)

    render(<UserSettings user={mockUser} />)

    const signOutButton = screen.getByText('Sign Out')
    await user.click(signOutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  test('handles sign out error gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockSignOut.mockRejectedValue(new Error('Sign out failed'))

    render(<UserSettings user={mockUser} />)

    const signOutButton = screen.getByText('Sign Out')
    await user.click(signOutButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  test('shows handle cannot be changed message', () => {
    render(<UserSettings user={mockUser} />)

    expect(screen.getByText(/Your handle cannot be changed after creation/)).toBeInTheDocument()
    expect(screen.getByText(/permanent identifier/)).toBeInTheDocument()
  })

  test('shows email managed by provider message', () => {
    render(<UserSettings user={mockUser} />)

    expect(screen.getByText(/managed through your social login provider/)).toBeInTheDocument()
  })
})