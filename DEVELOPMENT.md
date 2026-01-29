# Aide Development Guide

## Code Quality Standards

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety
- **No Implicit Any**: All variables must have explicit types
- **Strict Null Checks**: Null/undefined handling is explicit
- **No Unused Variables**: Warnings for unused code

### File Organization

#### Components (`src/components/`)
- **Naming**: PascalCase (e.g., `EnhancedPodcastPlayer.tsx`)
- **Structure**: One component per file
- **Exports**: Named export + default export
- **Documentation**: JSDoc comments for complex components

```typescript
/**
 * EnhancedPodcastPlayer - Beautiful animated podcast player
 * 
 * Features:
 * - Smooth play/pause animations
 * - Error state handling
 * - Loading skeleton
 * - Multi-language support
 * 
 * @component
 * @example
 * <EnhancedPodcastPlayer 
 *   podcastUrl="https://..." 
 *   language="en"
 * />
 */
export function EnhancedPodcastPlayer({ ... }) {
  // Component code
}
```

#### Hooks (`src/hooks/`)
- **Naming**: Camelcase with `use` prefix (e.g., `useAuth.ts`)
- **Single Responsibility**: One hook per file
- **Return Type**: Explicit type definition for hook returns
- **Error Handling**: Comprehensive try-catch blocks

```typescript
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthChecked: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  // Hook implementation
}
```

#### Types (`src/types/`)
- **Naming**: PascalCase interfaces (e.g., `AnalysisData`)
- **Organization**: Related types grouped together
- **Documentation**: JSDoc for complex types
- **Consistency**: Standardized naming conventions

```typescript
export interface AnalysisData {
  /** Metadata about the analysis */
  metadata?: {
    language?: string;
    subject_domain?: string;
    complexity_level?: 'beginner' | 'intermediate' | 'advanced';
  };
  
  /** Three main points from the content */
  three_bullet_summary?: string[];
  
  // ... more properties
}
```

#### Pages (`src/pages/`)
- **Naming**: PascalCase (e.g., `Dashboard.tsx`)
- **Route-based**: One page per route
- **Hooks Usage**: Extensively use custom hooks
- **Error Boundaries**: Wrap complex pages with ErrorBoundary

### Import Organization

```typescript
// 1. React and external libraries
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// 2. UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 3. Custom components
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 4. Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Types
import type { User } from '@supabase/supabase-js';

// 6. Utils and services
import { supabase } from '@/integrations/supabase/client';
```

## Best Practices

### State Management

**Use custom hooks for:**
- Authentication state
- Podcast playback state
- Usage/subscription tracking
- Complex state logic

**Use Context for:**
- Global auth state
- Theme/language settings
- Feature flags

**Use local state for:**
- UI state (modals, dropdowns)
- Form state
- Temporary UI values

```typescript
// ✅ Good: Using custom hook
const { user, isLoading } = useAuth();

// ✅ Good: Using context for global state
const { language, setLanguage } = useSettings();

// ✅ Good: Using local state for UI
const [isOpen, setIsOpen] = useState(false);
```

### Error Handling

**Edge Functions:**
```typescript
// Validate inputs
if (!input.text?.trim() && !input.media) {
  throw new Error("No content provided");
}

// Handle API errors with specific messages
if (res.status === 429) {
  throw new Error("Rate limit exceeded. Please try again later.");
}

// Log errors for debugging
console.error('Analysis error:', error);
```

**Components:**
```typescript
// Use try-catch in async functions
try {
  const result = await generatePodcast(text, language);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  toast({ title: 'Error', description: message, variant: 'destructive' });
}

// Use ErrorBoundary for render errors
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>
```

### Loading States

Always provide loading states for:
- Data fetching
- File uploads
- Podcast generation
- User interactions

```typescript
// Use skeleton loaders
{isLoading ? <SkeletonAnalysis /> : <Analysis data={data} />}

// Use loading cards
{isPodcastGenerating && <Card className="animate-pulse">...</Card>}

// Use disabled buttons
<Button disabled={isProcessing}>Submit</Button>
```

### Animations

Use Tailwind CSS utilities for smooth animations:
```typescript
// Fade in when component mounts
<div className="animate-in fade-in-50 slide-in-from-top-4">
  Content
</div>

// Spin animation for loading
<div className="animate-spin">Loading...</div>

// Smooth transitions
<Button className="transition-transform hover:scale-110">Hover</Button>
```

### Type Safety

**Always specify types:**
```typescript
// ✅ Good
interface Props {
  title: string;
  count: number;
  onSubmit: (data: FormData) => Promise<void>;
}

function MyComponent({ title, count, onSubmit }: Props) {
  // ...
}

// ❌ Avoid
function MyComponent(props: any) {
  // ...
}
```

**Use discriminated unions for state:**
```typescript
// ✅ Good: Clear state machine
type PodcastState = 
  | { status: 'idle' }
  | { status: 'generating'; progress: number }
  | { status: 'ready'; url: string }
  | { status: 'error'; message: string };

// ❌ Avoid: Unclear combinations
type PodcastState = {
  isGenerating?: boolean;
  url?: string;
  error?: string;
  progress?: number;
};
```

## Testing Guidelines

### Unit Tests
```typescript
describe('useAuth', () => {
  it('should fetch user on mount', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });
  });
});
```

### Component Tests
```typescript
describe('EnhancedPodcastPlayer', () => {
  it('should play audio when button clicked', () => {
    render(<EnhancedPodcastPlayer podcastUrl="..." />);
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
```

## Performance Tips

1. **Memoize expensive computations**
   ```typescript
   const expensiveValue = useMemo(() => complexCalculation(), [deps]);
   ```

2. **Code split routes**
   ```typescript
   const Dashboard = lazy(() => import('@/pages/Dashboard'));
   ```

3. **Use React Query for server state**
   ```typescript
   const { data } = useQuery(['analyses'], () => fetchAnalyses());
   ```

4. **Batch database operations**
   ```typescript
   // Do: Single operation
   await supabase.from('table').insert([item1, item2, item3]);
   
   // Don't: Multiple operations
   await supabase.from('table').insert([item1]);
   await supabase.from('table').insert([item2]);
   ```

## Common Patterns

### Async Data Loading
```typescript
useEffect(() => {
  if (!userId) return;
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchData(userId);
      setData(data);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
}, [userId]);
```

### Form Handling
```typescript
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  const validation = validateForm(formData);
  if (!validation.valid) {
    setErrors(validation.errors);
    return;
  }
  
  try {
    await submitForm(formData);
    toast({ title: 'Success!' });
  } catch (error) {
    setErrors({ submit: error.message });
  }
};
```

## Code Review Checklist

- [ ] TypeScript types are complete (no `any`)
- [ ] Error handling is comprehensive
- [ ] Loading states are provided
- [ ] Animations are smooth and purposeful
- [ ] Components are properly documented
- [ ] Hooks follow naming conventions
- [ ] No memory leaks (proper cleanup)
- [ ] Responsive design is implemented
- [ ] Accessibility is considered (ARIA labels)
- [ ] Performance is optimized

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)

---

**Last Updated**: 2024
**Maintained By**: Development Team
