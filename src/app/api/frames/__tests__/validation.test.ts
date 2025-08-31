/**
 * Unit tests for frame API validation logic
 */

import {
  validateFrameHandle,
  validateFrameTitle,
  validateFrameDescription,
  validateFrameKeywords,
  validateFrameDimensions,
  validateFramePermissions,
  sanitizeString,
  VALIDATION_MESSAGES
} from '@/lib/validation'

describe('Frame API Validation', () => {
  describe('validateFrameHandle', () => {
    it('should accept valid frame handles', () => {
      expect(validateFrameHandle('abc')).toBe(true) // 3 chars minimum
      expect(validateFrameHandle('my-frame')).toBe(true)
      expect(validateFrameHandle('frame_123')).toBe(true)
      expect(validateFrameHandle('a'.repeat(100))).toBe(true) // 100 chars maximum
    })

    it('should reject invalid frame handles', () => {
      expect(validateFrameHandle('ab')).toBe(false) // Too short
      expect(validateFrameHandle('a'.repeat(101))).toBe(false) // Too long
      expect(validateFrameHandle('frame with spaces')).toBe(false) // Spaces not allowed
      expect(validateFrameHandle('frame@special')).toBe(false) // Special chars not allowed
      expect(validateFrameHandle('')).toBe(false) // Empty
    })
  })

  describe('validateFrameTitle', () => {
    it('should accept valid titles', () => {
      expect(validateFrameTitle('My Frame')).toBe(true)
      expect(validateFrameTitle('A')).toBe(true) // Single character
      expect(validateFrameTitle('A'.repeat(255))).toBe(true) // Max length
    })

    it('should reject invalid titles', () => {
      expect(validateFrameTitle('')).toBe(false) // Empty
      expect(validateFrameTitle('   ')).toBe(false) // Only whitespace
      expect(validateFrameTitle('A'.repeat(256))).toBe(false) // Too long
    })
  })

  describe('validateFrameDescription', () => {
    it('should accept valid descriptions', () => {
      expect(validateFrameDescription('')).toBe(true) // Empty is allowed
      expect(validateFrameDescription('A nice frame')).toBe(true)
      expect(validateFrameDescription('A'.repeat(1000))).toBe(true) // Max length
    })

    it('should reject invalid descriptions', () => {
      expect(validateFrameDescription('A'.repeat(1001))).toBe(false) // Too long
    })
  })

  describe('validateFrameKeywords', () => {
    it('should accept valid keywords', () => {
      expect(validateFrameKeywords([])).toBe(true) // Empty array
      expect(validateFrameKeywords(['art', 'pixel'])).toBe(true)
      expect(validateFrameKeywords(['a'.repeat(50)])).toBe(true) // Max keyword length
      expect(validateFrameKeywords(Array(10).fill('keyword'))).toBe(true) // Max count
    })

    it('should reject invalid keywords', () => {
      expect(validateFrameKeywords(['a'.repeat(51)])).toBe(false) // Keyword too long
      expect(validateFrameKeywords(Array(11).fill('keyword'))).toBe(false) // Too many keywords
      expect(validateFrameKeywords([''])).toBe(false) // Empty keyword
      expect(validateFrameKeywords(['   '])).toBe(false) // Whitespace only keyword
    })
  })

  describe('validateFrameDimensions', () => {
    it('should accept valid frame dimensions', () => {
      expect(validateFrameDimensions(128, 72)).toBe(true) // Quick Landscape
      expect(validateFrameDimensions(72, 128)).toBe(true) // Quick Portrait
      expect(validateFrameDimensions(128, 128)).toBe(true) // Core Frame
      expect(validateFrameDimensions(512, 288)).toBe(true) // Epic Frame
    })

    it('should reject invalid frame dimensions', () => {
      expect(validateFrameDimensions(100, 100)).toBe(false) // Not a preset size
      expect(validateFrameDimensions(128, 100)).toBe(false) // Invalid height
      expect(validateFrameDimensions(100, 128)).toBe(false) // Invalid width
    })
  })

  describe('validateFramePermissions', () => {
    it('should accept valid permissions', () => {
      expect(validateFramePermissions('open')).toBe(true)
      expect(validateFramePermissions('approval-required')).toBe(true)
      expect(validateFramePermissions('owner-only')).toBe(true)
    })

    it('should reject invalid permissions', () => {
      expect(validateFramePermissions('invalid')).toBe(false)
      expect(validateFramePermissions('')).toBe(false)
      expect(validateFramePermissions('public')).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('should sanitize strings correctly', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world')
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeString('hello<>world')).toBe('helloworld')
      expect(sanitizeString('a'.repeat(300), 255)).toBe('a'.repeat(255))
    })

    it('should handle edge cases', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString('   ')).toBe('')
      expect(sanitizeString('<>')).toBe('')
    })
  })

  describe('validation messages', () => {
    it('should have all required validation messages', () => {
      expect(VALIDATION_MESSAGES.INVALID_FRAME_HANDLE).toBeDefined()
      expect(VALIDATION_MESSAGES.INVALID_TITLE).toBeDefined()
      expect(VALIDATION_MESSAGES.INVALID_DESCRIPTION).toBeDefined()
      expect(VALIDATION_MESSAGES.INVALID_KEYWORDS).toBeDefined()
      expect(VALIDATION_MESSAGES.INVALID_DIMENSIONS).toBeDefined()
      expect(VALIDATION_MESSAGES.INVALID_PERMISSIONS).toBeDefined()
    })

    it('should have meaningful error messages', () => {
      expect(VALIDATION_MESSAGES.INVALID_FRAME_HANDLE).toContain('3-100 characters')
      expect(VALIDATION_MESSAGES.INVALID_TITLE).toContain('required')
      expect(VALIDATION_MESSAGES.INVALID_DESCRIPTION).toContain('1000 characters')
      expect(VALIDATION_MESSAGES.INVALID_KEYWORDS).toContain('10 strings')
      expect(VALIDATION_MESSAGES.INVALID_DIMENSIONS).toContain('Invalid frame dimensions')
      expect(VALIDATION_MESSAGES.INVALID_PERMISSIONS).toContain('Invalid frame permissions')
    })
  })
})

describe('Frame API Business Logic', () => {
  describe('frame creation validation flow', () => {
    const validFrameData = {
      handle: 'test-frame',
      title: 'Test Frame',
      description: 'A test frame',
      keywords: ['test', 'frame'],
      width: 128,
      height: 128,
      permissions: 'open'
    }

    it('should validate complete frame data', () => {
      expect(validateFrameHandle(validFrameData.handle)).toBe(true)
      expect(validateFrameTitle(validFrameData.title)).toBe(true)
      expect(validateFrameDescription(validFrameData.description)).toBe(true)
      expect(validateFrameKeywords(validFrameData.keywords)).toBe(true)
      expect(validateFrameDimensions(validFrameData.width, validFrameData.height)).toBe(true)
      expect(validateFramePermissions(validFrameData.permissions)).toBe(true)
    })

    it('should sanitize frame data correctly', () => {
      const dirtyData = {
        title: '  <script>My Frame</script>  ',
        description: '  A frame with <b>HTML</b> tags  ',
        keywords: ['  keyword1  ', '<script>keyword2</script>', '  ']
      }

      const sanitizedTitle = sanitizeString(dirtyData.title, 255)
      const sanitizedDescription = sanitizeString(dirtyData.description, 1000)
      const sanitizedKeywords = dirtyData.keywords
        .map(keyword => sanitizeString(keyword, 50))
        .filter(k => k.length > 0)

      expect(sanitizedTitle).toBe('My Frame')
      expect(sanitizedDescription).toBe('A frame with HTML tags')
      expect(sanitizedKeywords).toEqual(['keyword1', 'keyword2'])
    })
  })

  describe('permission validation', () => {
    it('should validate permission types correctly', () => {
      const validPermissions = ['contributor', 'blocked', 'pending']
      const invalidPermissions = ['admin', 'moderator', 'viewer', '']

      validPermissions.forEach(permission => {
        expect(validPermissions.includes(permission)).toBe(true)
      })

      invalidPermissions.forEach(permission => {
        expect(validPermissions.includes(permission)).toBe(false)
      })
    })
  })

  describe('frame size presets', () => {
    it('should have correct frame size presets', () => {
      const presets = [
        { width: 128, height: 72, name: 'Quick Landscape' },
        { width: 72, height: 128, name: 'Quick Portrait' },
        { width: 128, height: 128, name: 'Core Frame' },
        { width: 512, height: 288, name: 'Epic Frame' }
      ]

      presets.forEach(preset => {
        expect(validateFrameDimensions(preset.width, preset.height)).toBe(true)
      })
    })

    it('should reject non-preset dimensions', () => {
      const invalidDimensions = [
        { width: 100, height: 100 },
        { width: 200, height: 200 },
        { width: 128, height: 100 },
        { width: 100, height: 128 }
      ]

      invalidDimensions.forEach(dim => {
        expect(validateFrameDimensions(dim.width, dim.height)).toBe(false)
      })
    })
  })
})