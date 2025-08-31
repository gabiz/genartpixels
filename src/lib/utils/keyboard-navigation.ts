/**
 * Keyboard navigation utilities for improved accessibility
 */

export interface KeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (event: KeyboardEvent) => void
  onHome?: () => void
  onEnd?: () => void
}

/**
 * Handle keyboard navigation events
 */
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  options: KeyboardNavigationOptions
) {
  switch (event.key) {
    case 'Escape':
      if (options.onEscape) {
        event.preventDefault()
        options.onEscape()
      }
      break
    case 'Enter':
      if (options.onEnter) {
        event.preventDefault()
        options.onEnter()
      }
      break
    case 'ArrowUp':
      if (options.onArrowUp) {
        event.preventDefault()
        options.onArrowUp()
      }
      break
    case 'ArrowDown':
      if (options.onArrowDown) {
        event.preventDefault()
        options.onArrowDown()
      }
      break
    case 'ArrowLeft':
      if (options.onArrowLeft) {
        event.preventDefault()
        options.onArrowLeft()
      }
      break
    case 'ArrowRight':
      if (options.onArrowRight) {
        event.preventDefault()
        options.onArrowRight()
      }
      break
    case 'Tab':
      if (options.onTab) {
        options.onTab(event)
      }
      break
    case 'Home':
      if (options.onHome) {
        event.preventDefault()
        options.onHome()
      }
      break
    case 'End':
      if (options.onEnd) {
        event.preventDefault()
        options.onEnd()
      }
      break
  }
}

/**
 * Focus trap utility for modals and dialogs
 */
export function createFocusTrap(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleTabKey(event: KeyboardEvent) {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleTabKey)

  // Focus first element
  if (firstElement) {
    firstElement.focus()
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const liveRegion = document.getElementById('live-region')
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = ''
    }, 1000)
  }
}

/**
 * Get next focusable element in a container
 */
export function getNextFocusableElement(
  container: HTMLElement,
  currentElement: HTMLElement,
  direction: 'next' | 'previous' = 'next'
): HTMLElement | null {
  const focusableElements = Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ) as HTMLElement[]

  const currentIndex = focusableElements.indexOf(currentElement)
  
  if (currentIndex === -1) return null

  let nextIndex: number
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % focusableElements.length
  } else {
    nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
  }

  return focusableElements[nextIndex] || null
}

/**
 * Check if element is visible and focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled') || element.getAttribute('tabindex') === '-1') {
    return false
  }

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false
  }

  return true
}

/**
 * Roving tabindex manager for grid/list navigation
 */
export class RovingTabindexManager {
  private container: HTMLElement
  private items: HTMLElement[]
  private currentIndex: number = 0

  constructor(container: HTMLElement, itemSelector: string) {
    this.container = container
    this.items = Array.from(container.querySelectorAll(itemSelector))
    this.init()
  }

  private init() {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1')
      item.addEventListener('keydown', this.handleKeyDown.bind(this))
      item.addEventListener('focus', () => this.setCurrentIndex(index))
    })
  }

  private handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    const currentIndex = this.items.indexOf(target)

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        this.moveToNext()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        this.moveToPrevious()
        break
      case 'Home':
        event.preventDefault()
        this.moveToFirst()
        break
      case 'End':
        event.preventDefault()
        this.moveToLast()
        break
    }
  }

  private setCurrentIndex(index: number) {
    this.items[this.currentIndex]?.setAttribute('tabindex', '-1')
    this.currentIndex = index
    this.items[this.currentIndex]?.setAttribute('tabindex', '0')
  }

  private moveToNext() {
    const nextIndex = (this.currentIndex + 1) % this.items.length
    this.setCurrentIndex(nextIndex)
    this.items[nextIndex]?.focus()
  }

  private moveToPrevious() {
    const prevIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1
    this.setCurrentIndex(prevIndex)
    this.items[prevIndex]?.focus()
  }

  private moveToFirst() {
    this.setCurrentIndex(0)
    this.items[0]?.focus()
  }

  private moveToLast() {
    const lastIndex = this.items.length - 1
    this.setCurrentIndex(lastIndex)
    this.items[lastIndex]?.focus()
  }

  public destroy() {
    this.items.forEach(item => {
      item.removeEventListener('keydown', this.handleKeyDown.bind(this))
    })
  }
}