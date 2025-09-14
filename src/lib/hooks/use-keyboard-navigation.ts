/**
 * React hooks for keyboard navigation and accessibility
 */

import { useEffect, useRef, useCallback } from 'react'
import { 
  handleKeyboardNavigation, 
  createFocusTrap, 
  announceToScreenReader,
  type KeyboardNavigationOptions 
} from '@/lib/utils/keyboard-navigation'

/**
 * Hook for handling keyboard navigation events
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyboardNavigation(event, options)
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [options])

  return ref
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(isActive: boolean = true) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !ref.current) return

    const cleanup = createFocusTrap(ref.current)
    return cleanup
  }, [isActive])

  return ref
}

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority)
  }, [])

  return announce
}

/**
 * Hook for managing roving tabindex in grids/lists
 */
export function useRovingTabindex(itemSelector: string, isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)
  const managerRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Dynamically import the manager to avoid SSR issues
    import('@/lib/utils/keyboard-navigation').then(({ RovingTabindexManager }) => {
      managerRef.current = new RovingTabindexManager(containerRef.current!, itemSelector)
    })

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy()
        managerRef.current = null
      }
    }
  }, [itemSelector, isActive])

  return containerRef
}

/**
 * Hook for handling escape key to close modals/dropdowns
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [callback, isActive])
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [])

  return { saveFocus, restoreFocus }
}

/**
 * Hook for detecting if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mediaQuery.matches

    const handleChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion.current = event.matches
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion.current
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLiveRegion() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create temporary live region if global one doesn't exist
    let liveRegion = document.getElementById('live-region')
    
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'temp-live-region'
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = message

    // Clean up temporary region
    if (liveRegion.id === 'temp-live-region') {
      setTimeout(() => {
        document.body.removeChild(liveRegion!)
      }, 1000)
    }
  }, [])

  return announce
}

/**
 * Hook for managing focus within a component
 */
export function useFocusManagement() {
  const focusFirstElement = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) {
      firstElement.focus()
    }
  }, [])

  const focusLastElement = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    if (lastElement) {
      lastElement.focus()
    }
  }, [])

  return { focusFirstElement, focusLastElement }
}