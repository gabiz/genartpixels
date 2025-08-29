---
inclusion: always
---

# Development Standards for Gen Art Pixels

## Code Organization

### File Structure
```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── canvas/            # Canvas-related components
│   ├── frames/            # Frame management components
│   └── auth/              # Authentication components
├── lib/                   # Utility functions and configurations
│   ├── supabase/          # Supabase client and utilities
│   ├── utils/             # General utilities
│   ├── validation/        # Validation schemas
│   └── types/             # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── styles/                # Global styles and Tailwind config
```

### Naming Conventions
- **Files**: kebab-case (`frame-canvas.tsx`, `pixel-utils.ts`)
- **Components**: PascalCase (`FrameCanvas`, `PixelPalette`)
- **Functions**: camelCase (`validateHandle`, `compressPixelData`)
- **Constants**: SCREAMING_SNAKE_CASE (`COLOR_PALETTE`, `MAX_FRAME_SIZE`)
- **Types/Interfaces**: PascalCase (`Frame`, `PixelPlacement`)

## Testing Requirements

### Test Coverage Expectations
- **Unit Tests**: All utility functions, validation logic, data transformations
- **Component Tests**: All React components with user interactions
- **Integration Tests**: API routes, database operations, real-time features
- **E2E Tests**: Critical user flows (registration, frame creation, pixel placement)

### Testing Patterns
```typescript
// Unit test example
describe('colorUtils', () => {
  test('converts hex to ARGB correctly', () => {
    expect(hexToArgb('#FF0000')).toBe(0xFFFF0000);
  });
});

// Component test example
describe('PixelPalette', () => {
  test('calls onColorSelect when color is clicked', () => {
    const onColorSelect = jest.fn();
    render(<PixelPalette onColorSelect={onColorSelect} />);
    fireEvent.click(screen.getByTestId('color-0xFF0000'));
    expect(onColorSelect).toHaveBeenCalledWith(0xFF0000);
  });
});
```

### Test File Organization
- Place test files adjacent to source files with `.test.ts` or `.test.tsx` extension
- Use `__tests__` directory for complex test suites
- Mock external dependencies (Supabase, Canvas API) consistently

## API Design Standards

### Route Structure
```
/api/
├── auth/                  # Authentication endpoints
├── frames/                # Frame CRUD operations
│   └── [userHandle]/
│       └── [frameHandle]/ # Individual frame operations
├── pixels/                # Pixel placement operations
└── users/                 # User management
```

### Response Format
```typescript
// Success response
interface APIResponse<T> {
  data: T;
  success: true;
}

// Error response
interface APIError {
  error: string;
  code: string;
  details?: any;
  success: false;
}
```

### Error Handling
- Use consistent error codes across all endpoints
- Provide meaningful error messages for client display
- Log detailed error information for debugging
- Return appropriate HTTP status codes

## Database Standards

### Migration Guidelines
- Use Supabase CLI for all schema changes
- Include both up and down migrations
- Test migrations on development data before production
- Document breaking changes in migration comments

### Query Optimization
- Use proper indexes for all frequently queried columns
- Avoid N+1 queries with proper joins or batching
- Use database functions for complex aggregations
- Monitor query performance with EXPLAIN ANALYZE

### Data Validation
- Implement validation at database level (constraints, triggers)
- Validate data types, ranges, and relationships
- Use database functions for complex validation logic
- Ensure referential integrity with foreign keys

## Component Development

### Component Structure
```typescript
interface ComponentProps {
  // Props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-styles">
      {/* JSX */}
    </div>
  );
}
```

### Styling Guidelines
- Use Tailwind CSS utility classes
- Create custom components for repeated patterns
- Use CSS variables for theme consistency
- Ensure responsive design with mobile-first approach

### State Management
- Use React hooks for local component state
- Use Supabase real-time subscriptions for server state
- Implement optimistic updates for better UX
- Handle loading and error states consistently

## Performance Standards

### Canvas Optimization
- Implement virtualization for large frames (>10k pixels)
- Use requestAnimationFrame for smooth animations
- Debounce zoom/pan events to prevent excessive renders
- Cache rendered frames when possible

### Real-time Optimization
- Batch pixel updates when multiple changes occur rapidly
- Use frame-specific channels to reduce unnecessary traffic
- Implement connection pooling and cleanup
- Handle offline/online state transitions gracefully

### Loading Performance
- Implement lazy loading for frame lists and images
- Use skeleton screens during loading states
- Optimize bundle size with code splitting
- Implement proper caching strategies

## Security Guidelines

### Input Validation
- Validate all user inputs on both client and server
- Sanitize data before database operations
- Use TypeScript for compile-time type checking
- Implement rate limiting on all endpoints

### Authentication Security
- Use Supabase Auth for all authentication flows
- Implement proper session management
- Validate user permissions on every request
- Use secure HTTP-only cookies when possible

### Data Protection
- Never expose sensitive data in client-side code
- Use environment variables for all secrets
- Implement proper CORS policies
- Log security events for monitoring

## Documentation Requirements

### Code Documentation
- Document all public functions and components
- Include usage examples for complex utilities
- Document API endpoints with request/response examples
- Maintain up-to-date README files

### Type Documentation
```typescript
/**
 * Represents a pixel placement on a frame
 */
interface PixelPlacement {
  /** Frame identifier */
  frameId: string;
  /** X coordinate (0-based) */
  x: number;
  /** Y coordinate (0-based) */
  y: number;
  /** Color in ARGB format */
  color: number;
  /** Handle of the user placing the pixel */
  userHandle: string;
}
```

These standards ensure consistent, maintainable, and high-quality code across the Gen Art Pixels platform.