'use client'

/**
 * Standardized error message component with consistent styling and behavior
 */

import React from 'react'
import { Alert, AlertTitle, AlertDescription, AlertCircleIcon, ExclamationTriangleIcon } from './alert'
import { Button } from './button'

export interface ErrorMessageProps {
  title?: string
  message: string
  details?: string
  variant?: 'error' | 'warning'
  onRetry?: () => void
  onDismiss?: () => void
  retryLabel?: string
  className?: string
  showDetails?: boolean
}

export function ErrorMessage({
  title,
  message,
  details,
  variant = 'error',
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  className = '',
  showDetails = false
}: ErrorMessageProps) {
  const [showDetailedError, setShowDetailedError] = React.useState(showDetails)

  const alertVariant = variant === 'error' ? 'destructive' : 'warning'
  const Icon = variant === 'error' ? AlertCircleIcon : ExclamationTriangleIcon

  return (
    <Alert variant={alertVariant} className={className}>
      <Icon />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>
        <p className="mb-3">{message}</p>
        
        {(onRetry || onDismiss) && (
          <div className="flex gap-2 mb-3">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
              >
                {retryLabel}
              </Button>
            )}
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}

        {details && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedError(!showDetailedError)}
              className="p-0 h-auto text-xs underline"
            >
              {showDetailedError ? 'Hide' : 'Show'} Details
            </Button>
            
            {showDetailedError && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer font-medium mb-1">
                  Technical Details
                </summary>
                <pre className="whitespace-pre-wrap break-all bg-muted p-2 rounded text-xs">
                  {details}
                </pre>
              </details>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Predefined error messages for common scenarios
 */
export const ErrorMessages = {
  Network: ({ onRetry }: { onRetry?: () => void } = {}) => (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  ),

  NotFound: ({ resource = 'resource' }: { resource?: string } = {}) => (
    <ErrorMessage
      title="Not Found"
      message={`The ${resource} you're looking for could not be found.`}
      variant="warning"
    />
  ),

  PermissionDenied: () => (
    <ErrorMessage
      title="Access Denied"
      message="You don't have permission to perform this action."
      variant="warning"
    />
  ),

  QuotaExceeded: ({ remainingTime }: { remainingTime?: number } = {}) => (
    <ErrorMessage
      title="Quota Exceeded"
      message={
        remainingTime 
          ? `You've used all your pixels. Next refill in ${Math.ceil(remainingTime / 60)} minutes.`
          : "You've used all your pixels. Please wait for your quota to refill."
      }
      variant="warning"
    />
  ),

  ValidationError: ({ field, message }: { field: string; message: string }) => (
    <ErrorMessage
      title={`Invalid ${field}`}
      message={message}
      variant="warning"
    />
  ),

  ServerError: ({ onRetry }: { onRetry?: () => void } = {}) => (
    <ErrorMessage
      title="Server Error"
      message="Something went wrong on our end. Please try again in a moment."
      onRetry={onRetry}
    />
  ),

  Offline: () => (
    <ErrorMessage
      title="You're Offline"
      message="Some features are unavailable while offline. Please check your connection."
      variant="warning"
    />
  )
}

/**
 * Hook for managing error state with standardized error handling
 */
export function useErrorState() {
  const [error, setError] = React.useState<{
    message: string
    title?: string
    details?: string
    variant?: 'error' | 'warning'
  } | null>(null)

  const showError = React.useCallback((
    message: string, 
    options?: {
      title?: string
      details?: string
      variant?: 'error' | 'warning'
    }
  ) => {
    setError({
      message,
      ...options
    })
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleApiError = React.useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error) {
      // Handle specific API error codes
      switch ((error as { code: string }).code) {
        case 'QUOTA_EXCEEDED':
          showError(
            (error as { message?: string }).message || "You've exceeded your pixel quota",
            { 
              title: 'Quota Exceeded',
              variant: 'warning',
              details: (error as { details?: string }).details 
            }
          )
          break
        case 'PERMISSION_DENIED':
          showError(
            (error as { message?: string }).message || "You don't have permission to perform this action",
            { 
              title: 'Access Denied',
              variant: 'warning',
              details: (error as { details?: string }).details 
            }
          )
          break
        case 'INVALID_HANDLE':
          showError(
            (error as { message?: string }).message || 'The handle you entered is invalid',
            { 
              title: 'Invalid Handle',
              variant: 'warning',
              details: (error as { details?: string }).details 
            }
          )
          break
        default:
          showError(
            (error as { message?: string }).message || 'An unexpected error occurred',
            { 
              title: 'Error',
              details: (error as { details?: string }).details 
            }
          )
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      showError((error as { message: string; stack?: string }).message, { details: (error as { stack?: string }).stack })
    } else {
      showError('An unexpected error occurred')
    }
  }, [showError])

  return {
    error,
    showError,
    clearError,
    handleApiError,
    ErrorComponent: error ? (
      <ErrorMessage
        title={error.title}
        message={error.message}
        details={error.details}
        variant={error.variant}
        onDismiss={clearError}
      />
    ) : null
  }
}