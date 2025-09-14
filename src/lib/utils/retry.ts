/**
 * Utility functions for handling retries with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

export class RetryError extends Error {
  constructor(
    message: string,
    public lastError: Error,
    public attempts: number
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = defaultShouldRetry
  } = options

  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on the last attempt or if shouldRetry returns false
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000
      
      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(jitteredDelay)}ms:`, lastError.message)
      
      await sleep(jitteredDelay)
    }
  }
  
  throw new RetryError(
    `Failed after ${maxAttempts} attempts`,
    lastError!,
    maxAttempts
  )
}

/**
 * Default retry logic - retry on network errors but not on client errors
 */
function defaultShouldRetry(error: unknown, attempt: number): boolean {
  const typedError = error as { status?: number; code?: string }
  
  // Don't retry client errors (4xx)
  if (typedError?.status && typedError.status >= 400 && typedError.status < 500) {
    return false
  }
  
  // Don't retry validation errors
  if (typedError?.code === 'VALIDATION_ERROR') {
    return false
  }
  
  // Don't retry permission errors
  if (typedError?.code === 'PERMISSION_DENIED') {
    return false
  }
  
  // Retry network errors, server errors, and timeouts
  return true
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry wrapper for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options)
    
    // Throw error for non-ok responses to trigger retry logic
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as Error & { status: number; response: Response }).status = response.status
      ;(error as Error & { status: number; response: Response }).response = response
      throw error
    }
    
    return response
  }, {
    shouldRetry: (error, attempt) => {
      // Custom retry logic for HTTP requests
      const typedError = error as { status?: number }
      const status = typedError?.status
      
      // Don't retry client errors (4xx) except for 408, 429
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false
      }
      
      // Retry server errors (5xx), timeouts (408), rate limits (429), and network errors
      return true
    },
    ...retryOptions
  })
}

/**
 * Hook for managing retry state in React components
 */
export function useRetry() {
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  
  const executeWithRetry = React.useCallback(async <T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> => {
    setIsRetrying(true)
    setRetryCount(0)
    
    try {
      const result = await withRetry(fn, {
        ...options,
        shouldRetry: (error, attempt) => {
          setRetryCount(attempt)
          return options?.shouldRetry?.(error, attempt) ?? defaultShouldRetry(error, attempt)
        }
      })
      
      return result
    } finally {
      setIsRetrying(false)
    }
  }, [])
  
  return {
    isRetrying,
    retryCount,
    executeWithRetry
  }
}

// Import React for the hook
import React from 'react'