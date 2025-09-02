'use client'

/**
 * Test page for comprehensive error handling features
 */

import React, { useState } from 'react'
import { 
  ErrorBoundary, 
  ErrorMessage, 
  ErrorMessages, 
  OfflineIndicator,
  CompactOfflineIndicator,
  LoadingState,
  LoadingOverlay,
  useErrorState,
  useLoadingState
} from '@/components/ui'
import { useErrorHandling } from '@/hooks/use-error-handling'
import { validateHandle, useFormValidation, ValidationRules } from '@/lib/validation/enhanced-validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Component that can throw errors for testing
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from component')
  }
  return <div className="p-4 bg-green-100 rounded">No errors here! ✅</div>
}

// Form validation demo
function ValidationDemo() {
  const { data, errors, touched, updateField, touchField, validateAll } = useFormValidation(
    { handle: '', email: '' },
    {
      handle: [
        ValidationRules.required('Handle is required'),
        ValidationRules.minLength(5, 'Handle must be at least 5 characters'),
        ValidationRules.pattern(/^[a-zA-Z0-9_-]+$/, 'Handle can only contain letters, numbers, underscores, and dashes')
      ],
      email: [
        ValidationRules.required('Email is required'),
        ValidationRules.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
      ]
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateAll()) {
      alert('Form is valid!')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Validation Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Enter handle"
              value={data.handle}
              onChange={(e) => updateField('handle', e.target.value)}
              onBlur={() => touchField('handle')}
              className={errors.handle && touched.handle ? 'border-red-500' : ''}
            />
            {errors.handle && touched.handle && (
              <p className="text-sm text-red-500 mt-1">{errors.handle}</p>
            )}
          </div>
          
          <div>
            <Input
              type="email"
              placeholder="Enter email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => touchField('email')}
              className={errors.email && touched.email ? 'border-red-500' : ''}
            />
            {errors.email && touched.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
          
          <Button type="submit">Validate Form</Button>
        </form>
      </CardContent>
    </Card>
  )
}

// API error handling demo
function ApiErrorDemo() {
  const { executeWithErrorHandling, ErrorComponent, isRetrying } = useErrorHandling()
  const { isLoading, withLoading } = useLoadingState()

  const simulateApiCall = async (errorType: string) => {
    await withLoading(async () => {
      await executeWithErrorHandling(async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        switch (errorType) {
          case 'network':
            throw new Error('fetch failed')
          case 'quota':
            throw { code: 'QUOTA_EXCEEDED', message: 'Pixel quota exceeded', remainingTime: 3600 }
          case 'permission':
            throw { code: 'PERMISSION_DENIED', message: 'Access denied' }
          case 'validation':
            throw { code: 'VALIDATION_ERROR', field: 'handle', message: 'Invalid handle format' }
          case 'server':
            throw { code: 'SERVER_ERROR', message: 'Internal server error' }
          case 'success':
            return 'Success!'
          default:
            throw new Error('Unknown error')
        }
      }, `Testing ${errorType} error`)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Error Handling Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button 
            onClick={() => simulateApiCall('network')} 
            variant="outline"
            disabled={isLoading}
          >
            Network Error
          </Button>
          <Button 
            onClick={() => simulateApiCall('quota')} 
            variant="outline"
            disabled={isLoading}
          >
            Quota Error
          </Button>
          <Button 
            onClick={() => simulateApiCall('permission')} 
            variant="outline"
            disabled={isLoading}
          >
            Permission Error
          </Button>
          <Button 
            onClick={() => simulateApiCall('validation')} 
            variant="outline"
            disabled={isLoading}
          >
            Validation Error
          </Button>
          <Button 
            onClick={() => simulateApiCall('server')} 
            variant="outline"
            disabled={isLoading}
          >
            Server Error
          </Button>
          <Button 
            onClick={() => simulateApiCall('success')} 
            variant="outline"
            disabled={isLoading}
          >
            Success
          </Button>
        </div>
        
        {isLoading && <LoadingState message="Processing request..." />}
        {isRetrying && <div className="text-sm text-muted-foreground">Retrying...</div>}
        {ErrorComponent}
      </CardContent>
    </Card>
  )
}

// Error boundary demo
function ErrorBoundaryDemo() {
  const [shouldThrow, setShouldThrow] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Boundary Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => setShouldThrow(true)}
            variant="destructive"
          >
            Throw Error
          </Button>
          <Button 
            onClick={() => setShouldThrow(false)}
            variant="outline"
          >
            Reset
          </Button>
        </div>
        
        <ErrorBoundary>
          <ErrorThrower shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </CardContent>
    </Card>
  )
}

// Predefined error messages demo
function ErrorMessagesDemo() {
  const [selectedError, setSelectedError] = useState<string | null>(null)

  const errorTypes = [
    { key: 'network', label: 'Network Error', component: <ErrorMessages.Network onRetry={() => setSelectedError(null)} /> },
    { key: 'notfound', label: 'Not Found', component: <ErrorMessages.NotFound resource="frame" /> },
    { key: 'permission', label: 'Permission Denied', component: <ErrorMessages.PermissionDenied /> },
    { key: 'quota', label: 'Quota Exceeded', component: <ErrorMessages.QuotaExceeded remainingTime={3600} /> },
    { key: 'validation', label: 'Validation Error', component: <ErrorMessages.ValidationError field="handle" message="Handle is too short" /> },
    { key: 'server', label: 'Server Error', component: <ErrorMessages.ServerError onRetry={() => setSelectedError(null)} /> },
    { key: 'offline', label: 'Offline', component: <ErrorMessages.Offline /> }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predefined Error Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {errorTypes.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setSelectedError(key)}
              variant="outline"
              size="sm"
            >
              {label}
            </Button>
          ))}
          <Button
            onClick={() => setSelectedError(null)}
            variant="ghost"
            size="sm"
          >
            Clear
          </Button>
        </div>
        
        {selectedError && (
          <div className="mt-4">
            {errorTypes.find(e => e.key === selectedError)?.component}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ErrorHandlingTestPage() {
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Error Handling Test Page</h1>
        <div className="flex items-center gap-4">
          <CompactOfflineIndicator />
        </div>
      </div>

      <OfflineIndicator showWhenOnline={true} />

      <div className="grid gap-6">
        <ValidationDemo />
        <ApiErrorDemo />
        <ErrorBoundaryDemo />
        <ErrorMessagesDemo />
        
        <Card>
          <CardHeader>
            <CardTitle>Loading States Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowLoadingOverlay(true)
                  setTimeout(() => setShowLoadingOverlay(false), 3000)
                }}
              >
                Show Loading Overlay
              </Button>
            </div>
            
            <LoadingOverlay isLoading={showLoadingOverlay} message="Processing...">
              <div className="p-8 bg-muted rounded-lg">
                <p>This content will be overlaid with a loading state when the button is clicked.</p>
                <p>The overlay will automatically disappear after 3 seconds.</p>
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>This page demonstrates all the error handling components and utilities:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Form validation with real-time feedback</li>
          <li>API error handling with retry logic</li>
          <li>Error boundaries for component errors</li>
          <li>Predefined error message components</li>
          <li>Offline detection and indicators</li>
          <li>Loading states and overlays</li>
        </ul>
      </div>
    </div>
  )
}