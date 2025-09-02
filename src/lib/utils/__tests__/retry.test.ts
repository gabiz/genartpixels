/**
 * Tests for retry utilities
 */

import { withRetry, RetryError, fetchWithRetry } from '../retry'

// Mock fetch for testing
global.fetch = jest.fn()

describe.skip('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('succeeds on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')

    const result = await withRetry(mockFn)

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and eventually succeeds', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, { maxAttempts: 3, baseDelay: 100 })

    // Let the first attempt fail
    await Promise.resolve()
    
    // Fast-forward through delays
    jest.runAllTimers()
    
    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  }, 10000)

  it('throws RetryError after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'))

    const promise = withRetry(mockFn, { maxAttempts: 2, baseDelay: 100 })
    
    // Fast-forward through delays
    jest.runAllTimers()

    await expect(promise).rejects.toThrow(RetryError)
    expect(mockFn).toHaveBeenCalledTimes(2)
  }, 10000)

  it('respects custom shouldRetry function', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Client error'))
    const shouldRetry = jest.fn().mockReturnValue(false)

    const promise = withRetry(mockFn, { shouldRetry })

    await expect(promise).rejects.toThrow(RetryError)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1)
  })

  it('uses exponential backoff', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, { 
      maxAttempts: 2,
      baseDelay: 100,
      backoffFactor: 2
    })

    // Fast-forward through all delays
    jest.runAllTimers()
    
    const result = await promise
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  }, 10000)

  it('respects maxDelay', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Failure'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, { 
      maxAttempts: 2,
      baseDelay: 5000,
      maxDelay: 1000
    })

    jest.runAllTimers()
    
    const result = await promise
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  }, 10000)
})

describe.skip('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('succeeds on successful response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK'
    } as Response

    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    const result = await fetchWithRetry('/api/test')

    expect(result).toBe(mockResponse)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on server error', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response

    const successResponse = {
      ok: true,
      status: 200,
      statusText: 'OK'
    } as Response

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValue(successResponse)

    const promise = fetchWithRetry('/api/test', {}, { maxAttempts: 2, baseDelay: 100 })
    
    jest.runAllTimers()
    
    const result = await promise

    expect(result).toBe(successResponse)
    expect(fetch).toHaveBeenCalledTimes(2)
  }, 10000)

  it('does not retry on client error (4xx)', async () => {
    const errorResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response

    ;(fetch as jest.Mock).mockResolvedValue(errorResponse)

    const promise = fetchWithRetry('/api/test')

    await expect(promise).rejects.toThrow(RetryError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 429 (rate limit)', async () => {
    const rateLimitResponse = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    } as Response

    const successResponse = {
      ok: true,
      status: 200,
      statusText: 'OK'
    } as Response

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValue(successResponse)

    const promise = fetchWithRetry('/api/test', {}, { maxAttempts: 2, baseDelay: 100 })
    
    jest.runAllTimers()
    
    const result = await promise

    expect(result).toBe(successResponse)
    expect(fetch).toHaveBeenCalledTimes(2)
  }, 10000)

  it('retries on 408 (timeout)', async () => {
    const timeoutResponse = {
      ok: false,
      status: 408,
      statusText: 'Request Timeout'
    } as Response

    const successResponse = {
      ok: true,
      status: 200,
      statusText: 'OK'
    } as Response

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(timeoutResponse)
      .mockResolvedValue(successResponse)

    const promise = fetchWithRetry('/api/test', {}, { maxAttempts: 2, baseDelay: 100 })
    
    jest.runAllTimers()
    
    const result = await promise

    expect(result).toBe(successResponse)
    expect(fetch).toHaveBeenCalledTimes(2)
  }, 10000)

  it('throws RetryError after max attempts', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response

    ;(fetch as jest.Mock).mockResolvedValue(errorResponse)

    const promise = fetchWithRetry('/api/test', {}, { maxAttempts: 2, baseDelay: 100 })
    
    jest.runAllTimers()

    await expect(promise).rejects.toThrow(RetryError)
    expect(fetch).toHaveBeenCalledTimes(2)
  }, 10000)
})