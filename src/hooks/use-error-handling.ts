/**
 * Comprehensive error handling hook that integrates with offline detection and retry logic
 */

import { useCallback, useState } from 'react'
import { useOfflineDetection } from '@/lib/realtime'
import { withRetry, RetryOptions } from '@/lib/utils/retry'
import { useErrorState } from '@/components/ui/error-message'

export interface ErrorHandlingOptions {
  showOfflineErrors?: boolean
  retryOptions?: RetryOptions
  onError?: (error: Error) => void
}

export function useErrorHandling(options: ErrorHandlingOptions = {}) {
  const { isOnline, isConnected } = useOfflineDetection()
  const { error, showError, clearError, handleApiError, ErrorComponent } = useErrorState()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const {
    showOfflineErrors = true,
    retryOptions = {},
    onError
  } = options

  /**
   * Execute a function with comprehensive error handling
   */
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    errorContext?: string
  ): Promise<T | null> => {
    // Check offline status first
    if (!isOnline && showOfflineErrors) {
      showError(
        'You are currently offline. Please check your connection and try again.',
        { 
          title: 'Offline',
          variant: 'warning'
        }
      )
      return null
    }

    if (!isConnected && showOfflineErrors) {
      showError(
        'Connection issues detected. Please wait while we try to reconnect.',
        { 
          title: 'Connection Issues',
          variant: 'warning'
        }
      )
      return null
    }

    try {
      setIsRetrying(true)
      setRetryCount(0)

      const result = await withRetry(fn, {
        ...retryOptions,
        shouldRetry: (error, attempt) => {
          setRetryCount(attempt)
          
          // Don't retry if we're offline
          if (!isOnline) {
            return false
          }
          
          // Use custom retry logic if provided
          if (retryOptions.shouldRetry) {
            return retryOptions.shouldRetry(error, attempt)
          }
          
          // Default retry logic
          return attempt < (retryOptions.maxAttempts || 3)
        }
      })

      clearError()
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      // Call custom error handler
      onError?.(errorObj)
      
      // Handle specific error types
      if (error && typeof error === 'object' && 'code' in error) {
        handleApiError(error)
      } else if (errorObj.message.includes('fetch')) {
        showError(
          'Network error occurred. Please check your connection and try again.',
          {
            title: 'Network Error',
            details: errorContext ? `Context: ${errorContext}` : undefined
          }
        )
      } else {
        showError(
          errorObj.message || 'An unexpected error occurred',
          {
            title: errorContext || 'Error',
            details: errorObj.stack
          }
        )
      }
      
      return null
    } finally {
      setIsRetrying(false)
      setRetryCount(0)
    }
  }, [
    isOnline, 
    isConnected, 
    showOfflineErrors, 
    retryOptions, 
    onError, 
    showError, 
    clearError, 
    handleApiError
  ])

  /**
   * Handle API responses with error checking
   */
  const handleApiResponse = useCallback(async (
    response: Response,
    errorContext?: string
  ): Promise<any> => {
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: 'HTTP_ERROR'
        }
      }
      
      throw {
        ...errorData,
        status: response.status,
        context: errorContext
      }
    }
    
    return response.json()
  }, [])

  /**
   * Fetch with comprehensive error handling
   */
  const fetchWithErrorHandling = useCallback(async (
    url: string,
    options: RequestInit = {},
    errorContext?: string
  ): Promise<any> => {
    return executeWithErrorHandling(async () => {
      const response = await fetch(url, options)
      return handleApiResponse(response, errorContext)
    }, errorContext)
  }, [executeWithErrorHandling, handleApiResponse])

  /**
   * Handle form submission errors
   */
  const handleFormError = useCallback((error: any, fieldName?: string) => {
    if (error?.code === 'VALIDATION_ERROR' && error?.field) {
      showError(
        error.message || 'Validation failed',
        {
          title: `Invalid ${error.field}`,
          variant: 'warning'
        }
      )
    } else if (fieldName && error?.message) {
      showError(
        error.message,
        {
          title: `Error in ${fieldName}`,
          variant: 'warning'
        }
      )
    } else {
      handleApiError(error)
    }
  }, [showError, handleApiError])

  /**
   * Validate and handle quota errors specifically
   */
  const handleQuotaError = useCallback((error: any) => {
    if (error?.code === 'QUOTA_EXCEEDED') {
      const remainingTime = error?.remainingTime
      const message = remainingTime 
        ? `You've used all your pixels. Next refill in ${Math.ceil(remainingTime / 60)} minutes.`
        : "You've used all your pixels. Please wait for your quota to refill."
      
      showError(message, {
        title: 'Pixel Quota Exceeded',
        variant: 'warning'
      })
      return true
    }
    return false
  }, [showError])

  /**
   * Handle permission errors
   */
  const handlePermissionError = useCallback((error: any) => {
    if (error?.code === 'PERMISSION_DENIED') {
      showError(
        error.message || "You don't have permission to perform this action.",
        {
          title: 'Access Denied',
          variant: 'warning'
        }
      )
      return true
    }
    return false
  }, [showError])

  return {
    // State
    error,
    isRetrying,
    retryCount,
    isOnline,
    isConnected,
    
    // Actions
    executeWithErrorHandling,
    fetchWithErrorHandling,
    handleApiResponse,
    handleFormError,
    handleQuotaError,
    handlePermissionError,
    showError,
    clearError,
    
    // Components
    ErrorComponent
  }
}