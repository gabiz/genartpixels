'use client'

/**
 * Error boundary component for graceful error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertCircleIcon } from './alert'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error monitoring service integration
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error handled by hook:', error, errorInfo)
    
    // In a real app, you might want to show a toast or modal
    // For now, we'll just log it
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error monitoring service integration
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        ...errorInfo
      })
    }
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}