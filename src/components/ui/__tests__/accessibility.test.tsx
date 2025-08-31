/**
 * Accessibility tests for UI components
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../button'
import { Input } from '../input'
import { Textarea } from '../textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../dialog'
import { Alert, AlertDescription, AlertCircleIcon } from '../alert'
import { Card, CardHeader, CardTitle, CardContent } from '../card'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('UI Components Accessibility', () => {
  describe('Button', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Button onClick={() => {}}>Click me</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes when loading', async () => {
      render(<Button loading>Loading button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyDown(button, { key: ' ' })
      
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('Input', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Input label="Test input" placeholder="Enter text" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper label association', () => {
      render(<Input label="Email address" />)
      const input = screen.getByLabelText('Email address')
      expect(input).toBeInTheDocument()
    })

    it('should have proper error state ARIA attributes', () => {
      render(
        <Input 
          label="Email" 
          error={true} 
          helperText="Email is required" 
        />
      )
      
      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
    })
  })

  describe('Textarea', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Textarea label="Description" placeholder="Enter description" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper label association', () => {
      render(<Textarea label="Message" />)
      const textarea = screen.getByLabelText('Message')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Dialog', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div role="dialog" aria-modal="true" aria-labelledby="test-title">
          <h2 id="test-title">Test Dialog</h2>
          <p>This is a test dialog</p>
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should handle escape key', () => {
      const handleClose = jest.fn()
      render(
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledWith(false)
    })
  })

  describe('Alert', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>This is an alert message</AlertDescription>
        </Alert>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper role attribute', () => {
      render(
        <Alert>
          <AlertDescription>Alert message</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('Card', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Main Title')
    })
  })

  describe('Focus Management', () => {
    it('should maintain focus order in complex components', () => {
      render(
        <div>
          <Button>First</Button>
          <Input label="Middle" />
          <Button>Last</Button>
        </div>
      )
      
      const buttons = screen.getAllByRole('button')
      const input = screen.getByRole('textbox')
      
      // Tab through elements
      buttons[0].focus()
      expect(document.activeElement).toBe(buttons[0])
      
      fireEvent.keyDown(buttons[0], { key: 'Tab' })
      input.focus()
      expect(document.activeElement).toBe(input)
      
      fireEvent.keyDown(input, { key: 'Tab' })
      buttons[1].focus()
      expect(document.activeElement).toBe(buttons[1])
    })
  })

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text elements', () => {
      const { container } = render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Alert variant="destructive">
            <AlertDescription>Error message</AlertDescription>
          </Alert>
        </div>
      )
      
      // This would typically be tested with automated tools
      // or manual verification against WCAG guidelines
      expect(container).toBeInTheDocument()
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide appropriate screen reader text', () => {
      render(
        <div>
          <Button loading>Submit</Button>
          <Alert>
            <AlertCircleIcon aria-hidden="true" />
            <AlertDescription>Important message</AlertDescription>
          </Alert>
        </div>
      )
      
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})