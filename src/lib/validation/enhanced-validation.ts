/**
 * Enhanced validation utilities with better error handling and user feedback
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  details?: string
}

export interface ValidationRule<T> {
  validate: (value: T) => ValidationResult
  message?: string
}

/**
 * Enhanced handle validation with detailed feedback
 */
export function validateHandle(handle: string): ValidationResult {
  if (!handle) {
    return {
      isValid: false,
      error: 'Handle is required',
      details: 'Please enter a handle to identify your account'
    }
  }

  // Check for reserved words first (before length validation)
  const reservedWords = ['admin', 'api', 'www', 'app', 'test', 'demo', 'null', 'undefined']
  if (reservedWords.includes(handle.toLowerCase())) {
    return {
      isValid: false,
      error: 'Reserved handle',
      details: 'This handle is reserved and cannot be used'
    }
  }

  if (handle.length < 5) {
    return {
      isValid: false,
      error: 'Handle too short',
      details: 'Handle must be at least 5 characters long'
    }
  }

  if (handle.length > 20) {
    return {
      isValid: false,
      error: 'Handle too long',
      details: 'Handle must be no more than 20 characters long'
    }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return {
      isValid: false,
      error: 'Invalid characters',
      details: 'Handle can only contain letters, numbers, underscores, and dashes'
    }
  }

  if (handle.startsWith('_') || handle.startsWith('-')) {
    return {
      isValid: false,
      error: 'Invalid start character',
      details: 'Handle cannot start with underscore or dash'
    }
  }

  if (handle.endsWith('_') || handle.endsWith('-')) {
    return {
      isValid: false,
      error: 'Invalid end character',
      details: 'Handle cannot end with underscore or dash'
    }
  }

  return { isValid: true }
}

/**
 * Enhanced frame handle validation
 */
export function validateFrameHandle(handle: string): ValidationResult {
  if (!handle) {
    return {
      isValid: false,
      error: 'Frame handle is required',
      details: 'Please enter a handle to identify your frame'
    }
  }

  if (handle.length < 3) {
    return {
      isValid: false,
      error: 'Handle too short',
      details: 'Frame handle must be at least 3 characters long'
    }
  }

  if (handle.length > 100) {
    return {
      isValid: false,
      error: 'Handle too long',
      details: 'Frame handle must be no more than 100 characters long'
    }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return {
      isValid: false,
      error: 'Invalid characters',
      details: 'Frame handle can only contain letters, numbers, underscores, and dashes'
    }
  }

  return { isValid: true }
}

/**
 * Enhanced coordinate validation
 */
export function validateCoordinates(x: number, y: number, frameWidth: number, frameHeight: number): ValidationResult {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return {
      isValid: false,
      error: 'Invalid coordinates',
      details: 'Coordinates must be integers'
    }
  }

  if (x < 0 || y < 0) {
    return {
      isValid: false,
      error: 'Coordinates out of bounds',
      details: 'Coordinates cannot be negative'
    }
  }

  if (x >= frameWidth || y >= frameHeight) {
    return {
      isValid: false,
      error: 'Coordinates out of bounds',
      details: `Coordinates must be within frame bounds (${frameWidth}x${frameHeight})`
    }
  }

  return { isValid: true }
}

/**
 * Enhanced color validation
 */
export function validateColor(color: number): ValidationResult {
  if (!Number.isInteger(color)) {
    return {
      isValid: false,
      error: 'Invalid color format',
      details: 'Color must be an integer in ARGB format'
    }
  }

  if (color < 0 || color > 0xFFFFFFFF) {
    return {
      isValid: false,
      error: 'Color out of range',
      details: 'Color must be a valid 32-bit ARGB value'
    }
  }

  return { isValid: true }
}

/**
 * Enhanced form validation with multiple fields
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule<T[keyof T]>[]>
): {
  isValid: boolean
  errors: Record<keyof T, string>
  details: Record<keyof T, string>
} {
  const errors: Record<keyof T, string> = {} as Record<keyof T, string>
  const details: Record<keyof T, string> = {} as Record<keyof T, string>

  for (const [field, fieldRules] of Object.entries(rules) as [keyof T, ValidationRule<T[keyof T]>[]][]) {
    const value = data[field]
    
    for (const rule of fieldRules) {
      const result = rule.validate(value)
      if (!result.isValid) {
        errors[field] = result.error || rule.message || 'Validation failed'
        if (result.details) {
          details[field] = result.details
        }
        break // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    details
  }
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value) => ({
      isValid: value !== null && value !== undefined && value !== '',
      error: message
    }),
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && value.length >= min,
      error: message || `Must be at least ${min} characters long`
    }),
    message
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && value.length <= max,
      error: message || `Must be no more than ${max} characters long`
    }),
    message
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && regex.test(value),
      error: message
    }),
    message
  }),

  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => ({
      isValid: typeof value === 'number' && value >= min && value <= max,
      error: message || `Must be between ${min} and ${max}`
    }),
    message
  })
}

/**
 * Real-time validation hook for forms
 */
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  rules: Record<keyof T, ValidationRule<T[keyof T]>[]>
) {
  const [data, setData] = React.useState<T>(initialData)
  const [errors, setErrors] = React.useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  const validateField = React.useCallback((field: keyof T, value: T[keyof T]) => {
    const fieldRules = rules[field] || []
    
    for (const rule of fieldRules) {
      const result = rule.validate(value)
      if (!result.isValid) {
        setErrors(prev => ({
          ...prev,
          [field]: result.error || rule.message || 'Validation failed'
        }))
        return false
      }
    }
    
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
    return true
  }, [rules])

  const updateField = React.useCallback((field: keyof T, value: T[keyof T]) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Validate if field has been touched
    if (touched[field]) {
      validateField(field, value)
    }
  }, [touched, validateField])

  const touchField = React.useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, data[field])
  }, [data, validateField])

  const validateAll = React.useCallback(() => {
    const validation = validateForm(data, rules)
    setErrors(validation.errors)
    setTouched(Object.keys(data).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<keyof T, boolean>))
    return validation.isValid
  }, [data, rules])

  const reset = React.useCallback(() => {
    setData(initialData)
    setErrors({} as Record<keyof T, string>)
    setTouched({} as Record<keyof T, boolean>)
  }, [initialData])

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0
  }
}

// Import React for the hook
import React from 'react'