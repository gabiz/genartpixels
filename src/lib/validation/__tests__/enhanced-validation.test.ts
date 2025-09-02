/**
 * Tests for enhanced validation utilities
 */

import {
  validateHandle,
  validateFrameHandle,
  validateCoordinates,
  validateColor,
  validateForm,
  ValidationRules
} from '../enhanced-validation'

describe('validateHandle', () => {
  it('validates correct handles', () => {
    const validHandles = ['user123', 'test_user', 'my-handle', 'a1b2c3d4e5']
    
    validHandles.forEach(handle => {
      const result = validateHandle(handle)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  it('rejects empty handle', () => {
    const result = validateHandle('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Handle is required')
    expect(result.details).toBe('Please enter a handle to identify your account')
  })

  it('rejects handle too short', () => {
    const result = validateHandle('abc')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Handle too short')
    expect(result.details).toBe('Handle must be at least 5 characters long')
  })

  it('rejects handle too long', () => {
    const result = validateHandle('a'.repeat(21))
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Handle too long')
    expect(result.details).toBe('Handle must be no more than 20 characters long')
  })

  it('rejects invalid characters', () => {
    const invalidHandles = ['user@123', 'test user', 'handle!', 'user#tag']
    
    invalidHandles.forEach(handle => {
      const result = validateHandle(handle)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid characters')
      expect(result.details).toBe('Handle can only contain letters, numbers, underscores, and dashes')
    })
  })

  it('rejects handle starting with underscore or dash', () => {
    const result1 = validateHandle('_user123')
    expect(result1.isValid).toBe(false)
    expect(result1.error).toBe('Invalid start character')

    const result2 = validateHandle('-user123')
    expect(result2.isValid).toBe(false)
    expect(result2.error).toBe('Invalid start character')
  })

  it('rejects handle ending with underscore or dash', () => {
    const result1 = validateHandle('user123_')
    expect(result1.isValid).toBe(false)
    expect(result1.error).toBe('Invalid end character')

    const result2 = validateHandle('user123-')
    expect(result2.isValid).toBe(false)
    expect(result2.error).toBe('Invalid end character')
  })

  it('rejects reserved words', () => {
    const reservedWords = ['admin', 'api', 'www', 'app', 'test', 'demo', 'null', 'undefined']
    
    reservedWords.forEach(word => {
      const result = validateHandle(word)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Reserved handle')
      expect(result.details).toBe('This handle is reserved and cannot be used')
    })
  })

  it('rejects reserved words case-insensitive', () => {
    const result = validateHandle('ADMIN')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Reserved handle')
  })
})

describe('validateFrameHandle', () => {
  it('validates correct frame handles', () => {
    const validHandles = ['art', 'my_frame', 'test-123', 'a'.repeat(100)]
    
    validHandles.forEach(handle => {
      const result = validateFrameHandle(handle)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  it('rejects empty frame handle', () => {
    const result = validateFrameHandle('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Frame handle is required')
  })

  it('rejects frame handle too short', () => {
    const result = validateFrameHandle('ab')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Handle too short')
    expect(result.details).toBe('Frame handle must be at least 3 characters long')
  })

  it('rejects frame handle too long', () => {
    const result = validateFrameHandle('a'.repeat(101))
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Handle too long')
    expect(result.details).toBe('Frame handle must be no more than 100 characters long')
  })

  it('rejects invalid characters in frame handle', () => {
    const result = validateFrameHandle('frame@123')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Invalid characters')
  })
})

describe('validateCoordinates', () => {
  it('validates correct coordinates', () => {
    const result = validateCoordinates(10, 20, 100, 100)
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('validates edge coordinates', () => {
    const result1 = validateCoordinates(0, 0, 100, 100)
    expect(result1.isValid).toBe(true)

    const result2 = validateCoordinates(99, 99, 100, 100)
    expect(result2.isValid).toBe(true)
  })

  it('rejects non-integer coordinates', () => {
    const result = validateCoordinates(10.5, 20, 100, 100)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Invalid coordinates')
    expect(result.details).toBe('Coordinates must be integers')
  })

  it('rejects negative coordinates', () => {
    const result = validateCoordinates(-1, 20, 100, 100)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Coordinates out of bounds')
    expect(result.details).toBe('Coordinates cannot be negative')
  })

  it('rejects coordinates outside frame bounds', () => {
    const result1 = validateCoordinates(100, 50, 100, 100)
    expect(result1.isValid).toBe(false)
    expect(result1.error).toBe('Coordinates out of bounds')
    expect(result1.details).toBe('Coordinates must be within frame bounds (100x100)')

    const result2 = validateCoordinates(50, 100, 100, 100)
    expect(result2.isValid).toBe(false)
    expect(result2.error).toBe('Coordinates out of bounds')
  })
})

describe('validateColor', () => {
  it('validates correct colors', () => {
    const validColors = [0x00000000, 0xFFFFFFFF, 0xFF0000FF, 0x80808080]
    
    validColors.forEach(color => {
      const result = validateColor(color)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  it('rejects non-integer colors', () => {
    const result = validateColor(255.5)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Invalid color format')
    expect(result.details).toBe('Color must be an integer in ARGB format')
  })

  it('rejects colors out of range', () => {
    const result1 = validateColor(-1)
    expect(result1.isValid).toBe(false)
    expect(result1.error).toBe('Color out of range')

    const result2 = validateColor(0x100000000)
    expect(result2.isValid).toBe(false)
    expect(result2.error).toBe('Color out of range')
  })
})

describe('validateForm', () => {
  it('validates form with all valid fields', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    }

    const rules = {
      name: [ValidationRules.required('Name is required')],
      email: [ValidationRules.required('Email is required')],
      age: [ValidationRules.range(18, 100, 'Age must be between 18 and 100')]
    }

    const result = validateForm(data, rules)
    expect(result.isValid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('validates form with invalid fields', () => {
    const data = {
      name: '',
      email: 'john@example.com',
      age: 15
    }

    const rules = {
      name: [ValidationRules.required('Name is required')],
      email: [ValidationRules.required('Email is required')],
      age: [ValidationRules.range(18, 100, 'Age must be between 18 and 100')]
    }

    const result = validateForm(data, rules)
    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBe('Name is required')
    expect(result.errors.age).toBe('Age must be between 18 and 100')
    expect(result.errors.email).toBeUndefined()
  })

  it('stops at first error for each field', () => {
    const data = {
      password: ''
    }

    const rules = {
      password: [
        ValidationRules.required('Password is required'),
        ValidationRules.minLength(8, 'Password must be at least 8 characters')
      ]
    }

    const result = validateForm(data, rules)
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBe('Password is required')
  })
})

describe('ValidationRules', () => {
  describe('required', () => {
    const rule = ValidationRules.required('Field is required')

    it('passes for non-empty values', () => {
      expect(rule.validate('test').isValid).toBe(true)
      expect(rule.validate(123).isValid).toBe(true)
      expect(rule.validate(true).isValid).toBe(true)
    })

    it('fails for empty values', () => {
      expect(rule.validate('').isValid).toBe(false)
      expect(rule.validate(null).isValid).toBe(false)
      expect(rule.validate(undefined).isValid).toBe(false)
    })
  })

  describe('minLength', () => {
    const rule = ValidationRules.minLength(5)

    it('passes for strings meeting minimum length', () => {
      expect(rule.validate('hello').isValid).toBe(true)
      expect(rule.validate('hello world').isValid).toBe(true)
    })

    it('fails for strings below minimum length', () => {
      expect(rule.validate('hi').isValid).toBe(false)
      expect(rule.validate('').isValid).toBe(false)
    })
  })

  describe('maxLength', () => {
    const rule = ValidationRules.maxLength(10)

    it('passes for strings within maximum length', () => {
      expect(rule.validate('hello').isValid).toBe(true)
      expect(rule.validate('1234567890').isValid).toBe(true)
    })

    it('fails for strings exceeding maximum length', () => {
      expect(rule.validate('hello world!').isValid).toBe(false)
    })
  })

  describe('pattern', () => {
    const rule = ValidationRules.pattern(/^[a-z]+$/, 'Only lowercase letters allowed')

    it('passes for strings matching pattern', () => {
      expect(rule.validate('hello').isValid).toBe(true)
      expect(rule.validate('world').isValid).toBe(true)
    })

    it('fails for strings not matching pattern', () => {
      expect(rule.validate('Hello').isValid).toBe(false)
      expect(rule.validate('hello123').isValid).toBe(false)
    })
  })

  describe('range', () => {
    const rule = ValidationRules.range(1, 10)

    it('passes for numbers within range', () => {
      expect(rule.validate(1).isValid).toBe(true)
      expect(rule.validate(5).isValid).toBe(true)
      expect(rule.validate(10).isValid).toBe(true)
    })

    it('fails for numbers outside range', () => {
      expect(rule.validate(0).isValid).toBe(false)
      expect(rule.validate(11).isValid).toBe(false)
    })
  })
})