/**
 * Unit tests for HandleSelection component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HandleSelection } from '../handle-selection'
import { useAuth } from '@/lib/auth/context'

// Mock the auth context
jest.mock('@/lib/auth/context', () => ({
  useAuth: jest.fn(),
}))

// Mock validation
jest.mock('@/lib/validation', () => ({
  validateHandle: jest.fn(),
  VALIDATION_MESSAGES: {
    INVALID_HANDLE: 'Handle must be 5-20 characters long and contain only letters, numbers, underscores, and dashes',
  },
}))

const mockCreateHandle = jest.fn()
const mockOnComplete = jest.fn()

describe('HandleSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuth as jest.Mock).mockReturnValue({
      createHandle: mockCreateHandle,
      user: null,
      supabaseUser: { id: 'test-user-id', email: 'test@example.com' },
    })

    const { validateHandle } = require('@/lib/validation')
    validateHandle.mockImplementation((handle: string) => {
      return handle.length >= 5 && handle.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(handle)
    })
  })

  test('renders handle selection form', () => {
    render(<HandleSelection onComplete={mockOnComplete} />)

    expect(screen.getByText('Choose Your Handle')).toBeInTheDocument()
    expect(screen.getByLabelText('Handle')).toBeInTheDocument()
    expect(screen.getByText('Create Handle')).toBeInTheDocument()
  })

  test('shows requirements and preview', () => {
    render(<HandleSelection onComplete={mockOnComplete} />)

    expect(screen.getByText('5-20 characters long')).toBeInTheDocument()
    expect(screen.getByText('Letters, numbers, underscores, and dashes only')).toBeInTheDocument()
    expect(screen.getByText('Must be unique')).toBeInTheDocument()
  })

  test('validates handle input in real-time', async () => {
    const user = userEvent.setup()
    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    
    // Type invalid handle (too short)
    await user.type(input, 'abc')
    
    await waitFor(() => {
      expect(screen.getByText(/Handle must be 5-20 characters/)).toBeInTheDocument()
    })
  })

  test('shows preview for valid handle', async () => {
    const user = userEvent.setup()
    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    
    // Type valid handle
    await user.type(input, 'valid_handle')
    
    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('/valid_handle')).toBeInTheDocument()
    })
  })

  test('filters invalid characters from input', async () => {
    const user = userEvent.setup()
    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    
    // Type handle with invalid characters
    await user.type(input, 'test@handle!')
    
    // Should filter out invalid characters
    expect(input).toHaveValue('testhandle')
  })

  test('submits valid handle successfully', async () => {
    const user = userEvent.setup()
    mockCreateHandle.mockResolvedValue({ success: true })

    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    const submitButton = screen.getByText('Create Handle')
    
    await user.type(input, 'valid_handle')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateHandle).toHaveBeenCalledWith('valid_handle')
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  test('shows error for failed handle creation', async () => {
    const user = userEvent.setup()
    mockCreateHandle.mockResolvedValue({ 
      success: false, 
      error: 'Handle is already taken' 
    })

    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    const submitButton = screen.getByText('Create Handle')
    
    await user.type(input, 'taken_handle')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Handle is already taken')).toBeInTheDocument()
      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  test('disables submit button for invalid handle', async () => {
    const user = userEvent.setup()
    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    const submitButton = screen.getByText('Create Handle')
    
    // Initially disabled (no input)
    expect(submitButton).toBeDisabled()
    
    // Still disabled for invalid handle
    await user.type(input, 'abc')
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })

  test('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockCreateHandle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<HandleSelection onComplete={mockOnComplete} />)

    const input = screen.getByLabelText('Handle')
    const submitButton = screen.getByText('Create Handle')
    
    await user.type(input, 'valid_handle')
    await user.click(submitButton)

    expect(screen.getByText('Creating Handle...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  test('redirects if user already has handle', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      createHandle: mockCreateHandle,
      user: { handle: 'existing_handle' },
      supabaseUser: { id: 'test-user-id' },
    })

    render(<HandleSelection onComplete={mockOnComplete} />)

    expect(mockOnComplete).toHaveBeenCalled()
  })

  test('shows authentication required message when not authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      createHandle: mockCreateHandle,
      user: null,
      supabaseUser: null,
    })

    render(<HandleSelection onComplete={mockOnComplete} />)

    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument()
  })
})