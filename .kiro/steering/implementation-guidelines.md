---
inclusion: fileMatch
fileMatchPattern: 'tasks.md'
---

# Implementation Guidelines for Gen Art Pixels Tasks

## Task Execution Principles

### Incremental Development
- Complete one task fully before moving to the next
- Each task should result in working, testable functionality
- Create test pages/interfaces to verify each system independently
- Integrate components progressively as they're built

### Test-Driven Development
- Write tests alongside implementation, not after
- Include unit tests for all utility functions and business logic
- Add component tests for UI interactions and state management
- Create integration tests for API endpoints and database operations
- Implement E2E tests for complete user workflows

### Verification Strategy
- Create dedicated test pages for each major system:
  - `/dev/colors` - Color palette and utility testing
  - `/dev/database` - Database schema and operations verification
  - `/dev/auth` - Authentication flow testing
  - `/dev/api` - API endpoint testing with forms
  - `/dev/canvas` - Canvas rendering and interaction testing
  - `/dev/realtime` - Real-time collaboration testing
- Use these pages to verify functionality before integration

## Database Implementation

### Migration Best Practices
```sql
-- Always include descriptive comments
-- migration: 001_create_users_table.sql

-- Create users table with proper constraints
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle VARCHAR(20) UNIQUE NOT NULL CHECK (length(handle) >= 5),
  email VARCHAR(255) UNIQUE, -- Nullable for SSO-only auth
  avatar_url TEXT,
  pixels_available INTEGER DEFAULT 100,
  last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_last_refill ON users(last_refill);
```

### Trigger Implementation
- Use triggers for automatic stats updates
- Implement proper error handling in trigger functions
- Test trigger behavior with edge cases
- Document trigger logic and dependencies

## API Development

### Route Implementation Pattern
```typescript
// /api/frames/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateFrameCreation } from '@/lib/validation/frames';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    // Validate input
    const validation = validateFrameCreation(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    
    // Business logic
    const { data, error } = await supabase
      .from('frames')
      .insert(validation.data)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Database error', code: 'DB_ERROR', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### Validation Implementation
```typescript
// /lib/validation/frames.ts
import { z } from 'zod';

const frameCreationSchema = z.object({
  handle: z.string().min(3).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  keywords: z.array(z.string()).max(10),
  width: z.number().int().min(16).max(512),
  height: z.number().int().min(16).max(512),
  permissions: z.enum(['open', 'approval-required', 'owner-only'])
});

export function validateFrameCreation(data: unknown) {
  return frameCreationSchema.safeParse(data);
}
```

## Component Development

### Canvas Component Structure
```typescript
// /components/canvas/FrameCanvas.tsx
interface FrameCanvasProps {
  frame: Frame;
  pixels: Pixel[];
  onPixelClick?: (x: number, y: number) => void;
  showGrid?: boolean;
}

export function FrameCanvas({ frame, pixels, onPixelClick, showGrid }: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Canvas rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    renderFrame(ctx, frame, pixels, zoom, pan, showGrid);
  }, [frame, pixels, zoom, pan, showGrid]);
  
  // Event handlers
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !onPixelClick) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - pan.x) / zoom);
    const y = Math.floor((event.clientY - rect.top - pan.y) / zoom);
    
    if (x >= 0 && x < frame.width && y >= 0 && y < frame.height) {
      onPixelClick(x, y);
    }
  }, [frame, zoom, pan, onPixelClick]);
  
  return (
    <canvas
      ref={canvasRef}
      width={frame.width * zoom}
      height={frame.height * zoom}
      onClick={handleCanvasClick}
      className="border border-gray-300 cursor-crosshair"
    />
  );
}
```

### Real-time Integration
```typescript
// /hooks/useFrameRealtime.ts
export function useFrameRealtime(frameId: string) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const supabase = createClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`frame:${frameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pixels',
        filter: `frame_id=eq.${frameId}`
      }, (payload) => {
        const newPixel = payload.new as Pixel;
        setPixels(prev => [...prev.filter(p => p.x !== newPixel.x || p.y !== newPixel.y), newPixel]);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [frameId, supabase]);
  
  return { pixels };
}
```

## Testing Implementation

### Unit Test Examples
```typescript
// /lib/utils/colors.test.ts
describe('Color Utilities', () => {
  describe('hexToArgb', () => {
    test('converts red hex to ARGB', () => {
      expect(hexToArgb('#FF0000')).toBe(0xFFFF0000);
    });
    
    test('handles transparency', () => {
      expect(hexToArgb('#00000000')).toBe(0x00000000);
    });
  });
  
  describe('validatePixelCoordinates', () => {
    test('accepts valid coordinates', () => {
      expect(validatePixelCoordinates(10, 20, 128, 128)).toBe(true);
    });
    
    test('rejects out-of-bounds coordinates', () => {
      expect(validatePixelCoordinates(-1, 20, 128, 128)).toBe(false);
      expect(validatePixelCoordinates(10, 129, 128, 128)).toBe(false);
    });
  });
});
```

### Integration Test Examples
```typescript
// /api/frames/route.test.ts
describe('/api/frames', () => {
  test('creates frame with valid data', async () => {
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        handle: 'test-frame',
        title: 'Test Frame',
        description: 'A test frame',
        keywords: ['test'],
        width: 128,
        height: 128,
        permissions: 'open'
      })
    }));
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.handle).toBe('test-frame');
  });
});
```

## Performance Optimization

### Canvas Optimization
- Implement dirty rectangle rendering for large frames
- Use OffscreenCanvas for background processing when available
- Cache rendered tiles for zoom levels
- Implement viewport culling for very large frames

### Database Optimization
- Use prepared statements for repeated queries
- Implement connection pooling
- Use database functions for complex operations
- Monitor query performance with logging

### Real-time Optimization
- Batch pixel updates when multiple changes occur rapidly
- Implement exponential backoff for reconnection
- Use compression for large pixel data transfers
- Handle connection limits gracefully

## Error Handling

### Client-side Error Boundaries
```typescript
// /components/ui/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling
- Use consistent error response format
- Implement proper HTTP status codes
- Log errors with context for debugging
- Provide user-friendly error messages

These guidelines ensure consistent implementation across all tasks while maintaining high code quality and user experience.