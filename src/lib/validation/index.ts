/**
 * Validation utilities for Gen Art Pixels platform
 */

import { isValidPaletteColor } from '../utils/color-utils';

/**
 * Validate user handle format
 * @param handle - Handle to validate
 * @returns True if handle is valid
 */
export function validateHandle(handle: string): boolean {
  if (!handle || typeof handle !== 'string') {
    return false;
  }

  // 5-20 characters, alphanumeric, underscore, and dash allowed
  const handleRegex = /^[a-zA-Z0-9_-]{5,20}$/;
  return handleRegex.test(handle);
}

/**
 * Validate frame handle format
 * @param handle - Frame handle to validate
 * @returns True if frame handle is valid
 */
export function validateFrameHandle(handle: string): boolean {
  if (!handle || typeof handle !== 'string') {
    return false;
  }

  // 3-100 characters, alphanumeric, underscore, and dash allowed
  const frameHandleRegex = /^[a-zA-Z0-9_-]{3,100}$/;
  return frameHandleRegex.test(handle);
}

/**
 * Validate pixel coordinates
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param frameWidth - Frame width
 * @param frameHeight - Frame height
 * @returns True if coordinates are valid
 */
export function validateCoordinates(
  x: number, 
  y: number, 
  frameWidth: number, 
  frameHeight: number
): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < frameWidth &&
    y < frameHeight
  );
}

/**
 * Validate color value
 * @param color - ARGB color integer
 * @returns True if color is valid
 */
export function validateColor(color: number): boolean {
  return (
    Number.isInteger(color) &&
    color >= 0 &&
    color <= 0xFFFFFFFF &&
    isValidPaletteColor(color)
  );
}

/**
 * Validate frame dimensions
 * @param width - Frame width
 * @param height - Frame height
 * @returns True if dimensions are valid
 */
export function validateFrameDimensions(width: number, height: number): boolean {
  const validSizes = [
    { width: 128, height: 72 },   // Quick Landscape
    { width: 72, height: 128 },   // Quick Portrait
    { width: 128, height: 128 },  // Core Frame
    { width: 512, height: 288 }   // Epic Frame
  ];

  return validSizes.some(size => size.width === width && size.height === height);
}

/**
 * Validate frame permissions
 * @param permissions - Permission string
 * @returns True if permissions are valid
 */
export function validateFramePermissions(permissions: string): boolean {
  const validPermissions = ['open', 'approval-required', 'owner-only'];
  return validPermissions.includes(permissions);
}

/**
 * Validate frame title
 * @param title - Frame title
 * @returns True if title is valid
 */
export function validateFrameTitle(title: string): boolean {
  return (
    typeof title === 'string' &&
    title.trim().length > 0 &&
    title.length <= 255
  );
}

/**
 * Validate frame description
 * @param description - Frame description
 * @returns True if description is valid
 */
export function validateFrameDescription(description: string): boolean {
  return (
    typeof description === 'string' &&
    description.length <= 1000
  );
}

/**
 * Validate frame keywords
 * @param keywords - Array of keywords
 * @returns True if keywords are valid
 */
export function validateFrameKeywords(keywords: string[]): boolean {
  if (!Array.isArray(keywords)) {
    return false;
  }

  if (keywords.length > 10) {
    return false;
  }

  return keywords.every(keyword => 
    typeof keyword === 'string' &&
    keyword.trim().length > 0 &&
    keyword.length <= 50
  );
}

/**
 * Validate email format
 * @param email - Email address
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input
 * @param input - Input string
 * @param maxLength - Maximum length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '') // Remove HTML tags but keep content
    .replace(/[<>]/g, ''); // Remove any remaining angle brackets
}

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  INVALID_HANDLE: 'Handle must be 5-20 characters, alphanumeric, underscore, and dash only',
  INVALID_FRAME_HANDLE: 'Frame handle must be 3-100 characters, alphanumeric, underscore, and dash only',
  INVALID_COORDINATES: 'Invalid pixel coordinates',
  INVALID_COLOR: 'Invalid color value',
  INVALID_DIMENSIONS: 'Invalid frame dimensions',
  INVALID_PERMISSIONS: 'Invalid frame permissions',
  INVALID_TITLE: 'Title is required and must be less than 255 characters',
  INVALID_DESCRIPTION: 'Description must be less than 1000 characters',
  INVALID_KEYWORDS: 'Keywords must be an array of up to 10 strings, each less than 50 characters',
  INVALID_EMAIL: 'Invalid email format'
} as const;