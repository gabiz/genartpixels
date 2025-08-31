import {
  validateHandle,
  validateFrameHandle,
  validateCoordinates,
  validateColor,
  validateFrameDimensions,
  validateFramePermissions,
  validateFrameTitle,
  validateFrameDescription,
  validateFrameKeywords,
  validateEmail,
  sanitizeString,
  VALIDATION_MESSAGES
} from '../index';

describe('Validation Utils', () => {
  describe('validateHandle', () => {
    test('accepts valid handles', () => {
      expect(validateHandle('user123')).toBe(true);
      expect(validateHandle('test_user')).toBe(true);
      expect(validateHandle('user-name')).toBe(true);
      expect(validateHandle('a1b2c')).toBe(true);
      expect(validateHandle('12345678901234567890')).toBe(true); // 20 chars
    });

    test('rejects invalid handles', () => {
      expect(validateHandle('')).toBe(false);
      expect(validateHandle('abc')).toBe(false); // Too short
      expect(validateHandle('123456789012345678901')).toBe(false); // Too long
      expect(validateHandle('user@name')).toBe(false); // Invalid character
      expect(validateHandle('user name')).toBe(false); // Space
      expect(validateHandle('user.name')).toBe(false); // Dot
    });

    test('handles non-string inputs', () => {
      expect(validateHandle(null as unknown as string)).toBe(false);
      expect(validateHandle(undefined as unknown as string)).toBe(false);
      expect(validateHandle(123 as unknown as string)).toBe(false);
    });
  });

  describe('validateFrameHandle', () => {
    test('accepts valid frame handles', () => {
      expect(validateFrameHandle('abc')).toBe(true); // 3 chars minimum
      expect(validateFrameHandle('my-frame')).toBe(true);
      expect(validateFrameHandle('frame_123')).toBe(true);
      expect(validateFrameHandle('a'.repeat(100))).toBe(true); // 100 chars maximum
    });

    test('rejects invalid frame handles', () => {
      expect(validateFrameHandle('ab')).toBe(false); // Too short
      expect(validateFrameHandle('a'.repeat(101))).toBe(false); // Too long
      expect(validateFrameHandle('frame@name')).toBe(false); // Invalid character
    });
  });

  describe('validateCoordinates', () => {
    test('accepts valid coordinates', () => {
      expect(validateCoordinates(0, 0, 100, 100)).toBe(true);
      expect(validateCoordinates(50, 75, 100, 100)).toBe(true);
      expect(validateCoordinates(99, 99, 100, 100)).toBe(true);
    });

    test('rejects invalid coordinates', () => {
      expect(validateCoordinates(-1, 0, 100, 100)).toBe(false); // Negative x
      expect(validateCoordinates(0, -1, 100, 100)).toBe(false); // Negative y
      expect(validateCoordinates(100, 0, 100, 100)).toBe(false); // x >= width
      expect(validateCoordinates(0, 100, 100, 100)).toBe(false); // y >= height
      expect(validateCoordinates(1.5, 0, 100, 100)).toBe(false); // Non-integer x
      expect(validateCoordinates(0, 1.5, 100, 100)).toBe(false); // Non-integer y
    });
  });

  describe('validateColor', () => {
    test('accepts valid palette colors', () => {
      expect(validateColor(0x00000000)).toBe(true); // Transparent
      expect(validateColor(0xFFFFFFFF)).toBe(true); // White
      expect(validateColor(0xFF6D001A)).toBe(true); // Dark Red from palette
    });

    test('rejects invalid colors', () => {
      expect(validateColor(0xFFFF0001)).toBe(false); // Not in palette
      expect(validateColor(-1)).toBe(false); // Negative
      expect(validateColor(0x100000000)).toBe(false); // Too large
      expect(validateColor(1.5)).toBe(false); // Non-integer
    });
  });

  describe('validateFrameDimensions', () => {
    test('accepts valid frame sizes', () => {
      expect(validateFrameDimensions(128, 72)).toBe(true); // Quick Landscape
      expect(validateFrameDimensions(72, 128)).toBe(true); // Quick Portrait
      expect(validateFrameDimensions(128, 128)).toBe(true); // Core Frame
      expect(validateFrameDimensions(512, 288)).toBe(true); // Epic Frame
    });

    test('rejects invalid frame sizes', () => {
      expect(validateFrameDimensions(100, 100)).toBe(false);
      expect(validateFrameDimensions(128, 100)).toBe(false);
      expect(validateFrameDimensions(0, 0)).toBe(false);
    });
  });

  describe('validateFramePermissions', () => {
    test('accepts valid permissions', () => {
      expect(validateFramePermissions('open')).toBe(true);
      expect(validateFramePermissions('approval-required')).toBe(true);
      expect(validateFramePermissions('owner-only')).toBe(true);
    });

    test('rejects invalid permissions', () => {
      expect(validateFramePermissions('invalid')).toBe(false);
      expect(validateFramePermissions('')).toBe(false);
      expect(validateFramePermissions('OPEN')).toBe(false); // Case sensitive
    });
  });

  describe('validateFrameTitle', () => {
    test('accepts valid titles', () => {
      expect(validateFrameTitle('My Frame')).toBe(true);
      expect(validateFrameTitle('A')).toBe(true);
      expect(validateFrameTitle('A'.repeat(255))).toBe(true);
    });

    test('rejects invalid titles', () => {
      expect(validateFrameTitle('')).toBe(false);
      expect(validateFrameTitle('   ')).toBe(false); // Only whitespace
      expect(validateFrameTitle('A'.repeat(256))).toBe(false); // Too long
    });
  });

  describe('validateFrameDescription', () => {
    test('accepts valid descriptions', () => {
      expect(validateFrameDescription('')).toBe(true); // Empty is valid
      expect(validateFrameDescription('A description')).toBe(true);
      expect(validateFrameDescription('A'.repeat(1000))).toBe(true);
    });

    test('rejects invalid descriptions', () => {
      expect(validateFrameDescription('A'.repeat(1001))).toBe(false); // Too long
    });
  });

  describe('validateFrameKeywords', () => {
    test('accepts valid keywords', () => {
      expect(validateFrameKeywords([])).toBe(true); // Empty array
      expect(validateFrameKeywords(['art', 'pixel'])).toBe(true);
      expect(validateFrameKeywords(['a'.repeat(50)])).toBe(true); // Max length keyword
    });

    test('rejects invalid keywords', () => {
      expect(validateFrameKeywords('not-array' as unknown as string[])).toBe(false);
      expect(validateFrameKeywords(['a'.repeat(51)])).toBe(false); // Keyword too long
      expect(validateFrameKeywords(new Array(11).fill('keyword'))).toBe(false); // Too many keywords
      expect(validateFrameKeywords([''])).toBe(false); // Empty keyword
      expect(validateFrameKeywords(['   '])).toBe(false); // Whitespace only keyword
    });
  });

  describe('validateEmail', () => {
    test('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    test('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    test('trims and limits string length', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('a'.repeat(300), 10)).toBe('a'.repeat(10));
    });

    test('removes HTML tags', () => {
      expect(sanitizeString('hello<script>alert("xss")</script>world')).toBe('helloalert("xss")world');
      expect(sanitizeString('text<>more')).toBe('textmore');
    });

    test('handles non-string inputs', () => {
      expect(sanitizeString(null as unknown as string)).toBe('');
      expect(sanitizeString(undefined as unknown as string)).toBe('');
      expect(sanitizeString(123 as unknown as string)).toBe('');
    });
  });

  describe('VALIDATION_MESSAGES', () => {
    test('contains all expected message keys', () => {
      expect(VALIDATION_MESSAGES.INVALID_HANDLE).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_FRAME_HANDLE).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_COORDINATES).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_COLOR).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_DIMENSIONS).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_PERMISSIONS).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_TITLE).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_DESCRIPTION).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_KEYWORDS).toBeDefined();
      expect(VALIDATION_MESSAGES.INVALID_EMAIL).toBeDefined();
    });
  });
});