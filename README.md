# Aide - Structured AI Study Engine

A powerful, production-grade learning platform powered by AI that transforms educational content into comprehensive study materials including quizzes, flashcards, knowledge maps, and AI-generated podcasts.

## 🎯 Overview

Aide is a full-stack application that leverages modern AI technologies to help students and educators create rich, interactive study materials from any source content. The platform features:

- **Text Analysis**: AI-powered content breakdown into structured learning materials
- **Podcast Generation**: Automatic creation of AI-narrated educational podcasts
- **Interactive Quiz**: Adaptive quiz questions with difficulty levels
- **Flashcards**: Spaced repetition study system
- **Knowledge Maps**: Visual representation of concept relationships
- **Multi-language Support**: English, Russian, Armenian, Korean

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS + Shadcn UI for accessible, beautiful components
- **State Management**: Custom hooks (useAuth, usePodcast, useUsageLimit) + Context API
- **Routing**: React Router for client-side navigation
- **HTTP Client**: Supabase client for backend communication

### Backend (Supabase + Deno Edge Functions)
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth (email/password, OAuth)
- **Edge Functions**: Deno TypeScript runtime for serverless processing
- **Storage**: Supabase Storage for podcast audio files
- **RLS**: Row-level security for data protection

### AI Services
- **Text Analysis**: Lovable AI Gateway (Gemini 3 Flash)
- **Podcast Generation**: Google Gemini TTS API with multi-speaker support
- **Language Models**: Latest language and speech models

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── AnalysisOutput.tsx
│   ├── EnhancedPodcastPlayer.tsx
│   ├── ErrorBoundary.tsx      # Global error handling
│   ├── SkeletonLoaders.tsx    # Loading placeholders
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state + session mgmt
│   ├── usePodcast.ts   # Podcast generation + playback
│   ├── useUsageLimit.ts # Subscription + rate limiting
│   └── ...
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Global auth provider
├── types/              # TypeScript interfaces
│   └── index.ts        # Complete type definitions
├── pages/              # Page components (routes)
│   ├── Dashboard.tsx
│   ├── Library.tsx
│   ├── Auth.tsx
│   └── ...
├── lib/                # Utility functions
│   ├── utils.ts
│   ├── i18n.ts
│   └── settings.ts
├── integrations/       # External service clients
│   └── supabase/
│       └── client.ts
└── App.tsx             # Root component with error boundary

supabase/
├── migrations/         # Database schema migrations
├── functions/
│   ├── analyze-text/   # Text analysis edge function
│   ├── generate-podcast/ # Podcast generation edge function
│   └── ...
└── config.toml         # Supabase configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Supabase account
- Google Gemini API key
- Lovable AI API key

### Installation

```bash
# Clone repository
git clone <repo-url>
cd aide

# Install dependencies
bun install
# or
npm install

# Create .env.local with API keys
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Development

```bash
# Start dev server
bun run dev
# or
npm run dev

# Run tests
bun run test

# Run linter
bun run lint

# Build for production
bun run build
```

### Deploy

```bash
# Deploy to Vercel (frontend)
bun run deploy

# Deploy edge functions
supabase functions deploy

# Apply migrations
supabase migration deploy
```

## 🎨 Key Features & Improvements

### Custom Hooks Architecture
- **useAuth**: Centralized authentication state management
  - Session initialization and persistence
  - Auth state listener subscription
  - Auto-redirect on auth changes
  
- **usePodcast**: Podcast-specific state and logic
  - Generation with rate limit detection
  - Playback state management
  - Error handling and cleanup
  
- **useUsageLimit**: Subscription and rate limiting
  - Plan-based daily limits (free: 1, pro: 50, class: unlimited)
  - Usage tracking and refresh
  - Limit enforcement

### Type Safety
- Comprehensive TypeScript interfaces replacing `any`
- Complete type coverage for API responses
- Generic type definitions for components

### Error Handling
- Global ErrorBoundary component catches React errors
- Edge function validation and error messages
- User-friendly error displays with recovery options

### Loading States
- Beautiful skeleton loaders for all content types
- Smooth animations during data fetching
- Prevents layout shift with consistent placeholders

### Audio Management
- Proper cleanup on unmount
- Reload effects for URL changes
- Playback error handling

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Adaptive layouts for all screen sizes

## 🔐 Security Features

- **Row-Level Security (RLS)**: Database-level access control
- **Authentication**: Secure Supabase Auth tokens
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Free tier limited to 5 podcasts/day
- **Timeout Protection**: 90-second timeout for TTS generation

## 📊 Performance Optimizations

- **Code Splitting**: Route-based lazy loading (planned)
- **Parallel API Calls**: 3 simultaneous AI analysis calls
- **Caching**: React Query for server state management
- **Bundle Size**: Optimized with tree-shaking and minification
- **Edge Functions**: Fast serverless processing with Deno

## 🌍 Multi-language Support

- English (en)
- Russian (ru)
- Armenian (hy)
- Korean (ko)

Language detection and automatic translation of:
- UI labels and messages
- Generated quiz questions
- Flashcard content
- Podcast dialogues

## 📈 Usage Tiers

### Free Tier
- 1 analysis per day
- 5 podcasts per day
- Limited flashcards (20)
- Basic quiz questions (5)

### Pro Tier
- 50 analyses per day
- Unlimited podcasts
- Full flashcard library (unlimited)
- Extended quiz questions (20)

### Class Tier
- Unlimited analyses
- Unlimited podcasts
- All features included
- Perfect for educational institutions

## 🛠️ Development Workflow

### Adding a New Feature
1. Create/update TypeScript types in `src/types/index.ts`
2. Implement custom hook if needed (in `src/hooks/`)
3. Create component(s) with error handling
4. Add skeleton loader for loading state
5. Wrap with ErrorBoundary if standalone
6. Write tests (when testing framework is set up)

### Debugging
- Console logging in edge functions
- React DevTools for component state
- Network tab for API calls
- Supabase Dashboard for database state

## 📝 Recent Improvements

### Phase 1: Foundational Refactoring
✅ Extracted authentication logic to useAuth hook
✅ Created usePodcast hook for podcast state management
✅ Implemented useUsageLimit for subscription tracking
✅ Added comprehensive TypeScript interfaces

### Phase 2: Component Enhancement
✅ Created EnhancedPodcastPlayer with animations
✅ Added global ErrorBoundary component
✅ Built beautiful skeleton loaders
✅ Refactored Dashboard to use custom hooks

### Phase 3: Edge Function Improvements
✅ Enhanced analyze-text with validation and timeouts
✅ Improved error handling and user messaging
✅ Added input length and media format validation
✅ Implemented parallel API calls for speed

### Phase 4: UI/UX Polish
✅ Added smooth animations and transitions
✅ Improved loading states
✅ Better error messages and recovery options
✅ Mobile-responsive design

## 🔄 Future Roadmap

- [ ] Implement vitest testing framework
- [ ] Add code splitting for routes
- [ ] Migrate to react-i18next for translations
- [ ] Enhance neural map visualization with D3.js
- [ ] Add global loading animations
- [ ] Create CI/CD pipelines
- [ ] Implement WebSocket for real-time collaboration
- [ ] Add dark mode support

## 🤝 Contributing

1. Create a feature branch
2. Make your changes with tests
3. Submit a pull request
4. Follow the code style guide

## 📄 License

[Your License Here]

## 🆘 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@aide.app
- Visit: https://aide.app/help

---

**Built with ❤️ using React, TypeScript, and AI**
