# Aide - Quick Reference Guide

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run linter
bun run lint

# Build for production
bun run build
```

## 📁 Key Files Location

```
Dashboard:          src/pages/Dashboard.tsx
Auth Hook:          src/hooks/useAuth.ts
Podcast Hook:       src/hooks/usePodcast.ts
Usage Hook:         src/hooks/useUsageLimit.ts
Types:              src/types/index.ts
Error Boundary:     src/components/ErrorBoundary.tsx
Skeletons:          src/components/SkeletonLoaders.tsx

Analyze Function:   supabase/functions/analyze-text/index.ts
Podcast Function:   supabase/functions/generate-podcast/index.ts
```

## 💡 Common Tasks

### Add a New Component
```typescript
// 1. Create file: src/components/MyComponent.tsx
import { Card } from '@/components/ui/card';

export function MyComponent({ title }: { title: string }) {
  return <Card className="p-6">{title}</Card>;
}

// 2. Import where needed
import { MyComponent } from '@/components/MyComponent';
```

### Use Authentication
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthChecked, signOut } = useAuth();
  
  if (!isAuthChecked) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Hello, {user.email}</div>;
}
```

### Handle Podcast Generation
```typescript
import { usePodcast } from '@/hooks/usePodcast';

function PodcastGenerator() {
  const { 
    podcastAudio, 
    isGenerating, 
    error,
    generatePodcast,
    togglePlayback
  } = usePodcast();
  
  return (
    <button onClick={() => generatePodcast('topic', 'en')}>
      Generate Podcast
    </button>
  );
}
```

### Track Usage Limits
```typescript
import { useUsageLimit } from '@/hooks/useUsageLimit';

function UsageTracker({ userId }: { userId: string }) {
  const { usageCount, dailyLimit, userPlan, isLocked } = useUsageLimit(userId);
  
  return (
    <div>
      Analyses: {usageCount}/{dailyLimit}
      Plan: {userPlan}
      {isLocked && <div>Limit reached!</div>}
    </div>
  );
}
```

### Add Loading State
```typescript
import { SkeletonAnalysis } from '@/components/SkeletonLoaders';

function AnalysisView({ data, isLoading }) {
  if (isLoading) return <SkeletonAnalysis />;
  return <div>{/* Content */}</div>;
}
```

### Handle Errors
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary>
      <ComplexComponent />
    </ErrorBoundary>
  );
}
```

## 🎯 Code Patterns

### Async Operation Pattern
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleOperation = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    const result = await supabase.functions.invoke('function-name', {
      body: { /* data */ }
    });
    
    if (result.error) throw new Error(result.error.message);
    
    // Handle success
    toast({ title: 'Success!' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    toast({ title: 'Error', description: message, variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};
```

### Form Handling Pattern
```typescript
const [formData, setFormData] = useState({ name: '', email: '' });
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  try {
    setIsSubmitting(true);
    await submitData(formData);
    toast({ title: 'Success!' });
    // Reset form
    setFormData({ name: '', email: '' });
  } catch (error) {
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed',
      variant: 'destructive'
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

## 🔒 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key

# API Keys (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-key
LOVABLE_API_KEY=your-key
GEMINI_API_KEY=your-key
```

## 📊 Usage Limits

```typescript
// Free Tier
- 1 analysis per day
- 5 podcasts per day
- 20 flashcards max
- 5 quiz questions

// Pro Tier
- 50 analyses per day
- Unlimited podcasts
- Unlimited flashcards
- 20 quiz questions

// Class Tier
- Unlimited everything
```

## 🐛 Debugging

```typescript
// Check user auth
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Check function response
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* data */ }
});
console.log('Data:', data, 'Error:', error);

// Check API calls in Network tab
// Open DevTools > Network > XHR/Fetch
```

## 🎨 Available Tailwind Classes

### Animations
```typescript
// Fade in
className="animate-in fade-in-50"

// Slide from top
className="animate-in slide-in-from-top-4"

// Spin
className="animate-spin"

// Pulse
className="animate-pulse"

// Bounce
className="animate-bounce"
```

### Transitions
```typescript
className="transition-transform hover:scale-110"
className="transition-colors hover:text-primary"
className="transition-all duration-300"
```

### Gradients
```typescript
className="bg-gradient-to-r from-primary to-accent"
className="bg-gradient-to-br from-primary/10 to-accent/10"
```

## 📱 Responsive Breakpoints

```typescript
// Mobile-first
className="flex-col sm:flex-row"  // Stack on mobile, row on sm+
className="text-sm sm:text-base"  // Smaller on mobile
className="px-2 sm:px-4"         // Less padding on mobile
className="hidden sm:inline"      // Hide on mobile
```

## ⚡ Performance Tips

1. **Use useMemo for expensive computations**
   ```typescript
   const value = useMemo(() => expensiveFunction(), [deps]);
   ```

2. **Lazy load components**
   ```typescript
   const Dashboard = lazy(() => import('@/pages/Dashboard'));
   ```

3. **Batch database updates**
   ```typescript
   await supabase.from('table').insert([item1, item2, item3]);
   ```

4. **Use React Query**
   ```typescript
   const { data } = useQuery(['key'], fetchFn);
   ```

## 🔄 Common Errors & Fixes

### "Cannot read property 'split' of undefined"
- Check that `text` is not null/undefined before processing

### "Supabase client not initialized"
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in .env.local

### "User not authenticated"
- Redirect to `/auth` page
- Check session with `supabase.auth.getSession()`

### "Function timeout"
- Reduce text length (max 8,000 chars)
- Check network connection
- Verify API keys

### "Rate limit exceeded"
- Wait before next request
- Upgrade to Pro plan
- Check `usage_logs` table for today's count

## 📞 Support

- **Docs**: `README.md` and `DEVELOPMENT.md`
- **Issues**: Check GitHub issues
- **Email**: support@aide.app
- **Slack**: #aide-dev channel

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Status**: Production Ready
