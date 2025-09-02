/**
 * Tests for useErrorHandling hook
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useErrorHandling } from '../use-error-handling'

// Mock the dependencies
jest.mock('@/lib/realtime', () => ({
  useOfflineDetection: jest.fn()
}))

jest.mock('@/lib/utils/retry', () => ({
  withRetry: jest.fn()
}))

jest.mock('@/components/ui/error-message', () => ({
  useErrorState: jest.fn()
}))

import { useOfflineDetection } from '@/lib/realtime'
import { withRetry } from '@/lib/utils/retry'
import { useErrorState } from '@/components/ui/error-message'

const mockUseOfflineDetection = useOfflineDetection as jest.MockedFunction<typeof useOfflineDetection>
const mockWithRetry = withRetry as jest.MockedFunction<typeof withRetry>
const mockUseErrorState = useErrorState as jest.MockedFunction<typeof useErrorState>

describe('useErrorHandling', () => {
  const mockShowError = jest.fn()
  const mockClearError = jest.fn()
  const mockHandleApiError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseOfflineDetection.mockReturnValue({
      isOnline: true,
      isConnected: true
    })

    mockUseErrorState.mockReturnValue({
      error: null,
      showError: mockShowError,
      clearError: mockClearError,
      handleApiError: mockHandleApiError,
      ErrorComponent: null
    })

    mockWithRetry.mockImplementation(async (fn) => fn())
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useErrorHandling())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isConnected).toBe(true)
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryCount).toBe(0)
  })

  it('shows offline error when offline and showOfflineErrors is true', async () => {
    mockUseOfflineDetection.mockReturnValue({
      isOnline: false,
      isConnected: false
    })

    const { result } = renderHook(() => useErrorHandling({ showOfflineErrors: true }))

    const mockFn = jest.fn().mockResolvedValue('success')
    
    await act(async () => {
      const response = await result.current.executeWithErrorHandling(mockFn)
      expect(response).toBeNull()
    })

    expect(mockShowError).toHaveBeenCalledWith(
      'You are currently offline. Please check your connection and try again.',
      { title: 'Offline', variant: 'warning' }
    )
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('shows connection error when not connected', async () => {
    mockUseOfflineDetection.mockReturnValue({
      isOnline: true,
      isConnected: false
    })

    const { result } = renderHook(() => useErrorHandling())

    const mockFn = jest.fn().mockResolvedValue('success')
    
    await act(async () => {
      const response = await result.current.executeWithErrorHandling(mockFn)
      expect(response).toBeNull()
    })

    expect(mockShowError).toHaveBeenCalledWith(
      'Connection issues detected. Please wait while we try to reconnect.',
      { title: 'Connection Issues', variant: 'warning' }
    )
  })

  it('executes function successfully when online and connected', async () => {
    const { result } = renderHook(() => useErrorHandling())

    const mockFn = jest.fn().mockResolvedValue('success')
    
    let response: any
    await act(async () => {
      response = await result.current.executeWithErrorHandling(mockFn)
    })

    expect(response).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockClearError).toHaveBeenCalled()
  })

  it('handles API errors with error codes', async () => {
    const apiError = { code: 'QUOTA_EXCEEDED', message: 'Quota exceeded' }
    mockWithRetry.mockRejectedValue(apiError)

    const { result } = renderHook(() => useErrorHandling())

    const mockFn = jest.fn().mockRejectedValue(apiError)
    
    await act(async () => {
      const response = await result.current.executeWithErrorHandling(mockFn)
      expect(response).toBeNull()
    })

    expect(mockHandleApiError).toHaveBeenCalledWith(apiError)
  })

  it('handles network errors', async () => {
    const networkError = new Error('fetch failed')
    mockWithRetry.mockRejectedValue(networkError)

    const { result } = renderHook(() => useErrorHandling())

    const mockFn = jest.fn().mockRejectedValue(networkError)
    
    await act(async () => {
      const response = await result.current.executeWithErrorHandling(mockFn)
      expect(response).toBeNull()
    })

    expect(mockShowError).toHaveBeenCalledWith(
      'Network error occurred. Please check your connection and try again.',
      {
        title: 'Network Error',
        details: undefined
      }
    )
  })

  it('calls custom onError handler', async () => {
    const onError = jest.fn()
    const error = new Error('Test error')
    mockWithRetry.mockRejectedValue(error)

    const { result } = renderHook(() => useErrorHandling({ onError }))

    const mockFn = jest.fn().mockRejectedValue(error)
    
    await act(async () => {
      await result.current.executeWithErrorHandling(mockFn)
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('handles quota errors specifically', () => {
    const { result } = renderHook(() => useErrorHandling())

    const quotaError = { code: 'QUOTA_EXCEEDED', remainingTime: 3600 }
    
    act(() => {
      const handled = result.current.handleQuotaError(quotaError)
      expect(handled).toBe(true)
    })

    expect(mockShowError).toHaveBeenCalledWith(
      "You've used all your pixels. Next refill in 60 minutes.",
      { title: 'Pixel Quota Exceeded', variant: 'warning' }
    )
  })

  it('handles permission errors specifically', () => {
    const { result } = renderHook(() => useErrorHandling())

    const permissionError = { code: 'PERMISSION_DENIED', message: 'Access denied' }
    
    act(() => {
      const handled = result.current.handlePermissionError(permissionError)
      expect(handled).toBe(true)
    })

    expect(mockShowError).toHaveBeenCalledWith(
      'Access denied',
      { title: 'Access Denied', variant: 'warning' }
    )
  })

  it('handles form errors with field names', () => {
    const { result } = renderHook(() => useErrorHandling())

    const formError = { message: 'Invalid input' }
    
    act(() => {
      result.current.handleFormError(formError, 'username')
    })

    expect(mockShowError).toHaveBeenCalledWith(
      'Invalid input',
      { title: 'Error in username', variant: 'warning' }
    )
  })

  it('handles validation errors', () => {
    const { result } = renderHook(() => useErrorHandling())

    const validationError = { 
      code: 'VALIDATION_ERROR', 
      field: 'email',
      message: 'Invalid email format' 
    }
    
    act(() => {
      result.current.handleFormError(validationError)
    })

    expect(mockShowError).toHaveBeenCalledWith(
      'Invalid email format',
      { title: 'Invalid email', variant: 'warning' }
    )
  })

  it('fetchWithErrorHandling makes API calls with error handling', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'success' })
    })

    const { result } = renderHook(() => useErrorHandling())

    let response: any
    await act(async () => {
      response = await result.current.fetchWithErrorHandling('/api/test')
    })

    expect(response).toEqual({ data: 'success' })
    expect(fetch).toHaveBeenCalledWith('/api/test', {})
  })

  it('fetchWithErrorHandling handles API errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'Resource not found', code: 'NOT_FOUND' })
    })

    mockWithRetry.mockRejectedValue({
      error: 'Resource not found',
      code: 'NOT_FOUND',
      status: 404
    })

    const { result } = renderHook(() => useErrorHandling())

    await act(async () => {
      const response = await result.current.fetchWithErrorHandling('/api/test')
      expect(response).toBeNull()
    })

    expect(mockHandleApiError).toHaveBeenCalled()
  })
})