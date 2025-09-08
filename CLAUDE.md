# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based database analysis and comparison tool with multiple specialized features for database professionals. The application provides DDL comparison, capacity analysis, translation services, prompt generation, and diagram creation capabilities.

## Development Commands

- `npm run dev` - Start development server on port 8089
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build

### Testing
No test framework is configured in this project. When adding tests, check package.json dependencies first.

## Architecture Overview

### Core Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: TailwindCSS with custom theme configuration
- **State Management**: React Context (ConfigContext) for global configuration and history
- **Routing**: React Router DOM with HashRouter for SPA navigation
- **Internationalization**: i18next for multi-language support (English/Vietnamese)
- **HTTP Client**: Native fetch API with custom service layer
- **Icons**: Lucide React icon library

### Application Architecture

The app follows a modular page-based architecture with shared components:

```
src/
├── pages/           # Main application features
│   ├── DDLCompare.tsx          # Database schema comparison
│   ├── CapacityAnalysis.tsx    # Database storage capacity analysis
│   ├── Translation.tsx         # Multi-language text translation
│   ├── PromptGeneration.tsx    # AI prompt creation tools
│   ├── Diagram.tsx            # PlantUML diagram generation
│   └── Settings.tsx           # Application configuration
├── components/      # Reusable UI components
│   ├── layout/     # Layout components (AppLayout, Sidebar)
│   └── ui/         # shadcn/ui component library
├── contexts/       # React Context providers
├── lib/           # Core business logic and services
├── types/         # TypeScript type definitions
├── data/          # Static data and configuration
└── utils/         # Utility functions
```

### Key Services and Libraries

#### ChatGPT Integration (`src/lib/chatgpt.ts`)
- Comprehensive service for OpenAI API integration
- Supports multiple AI models with automatic model validation
- Request queuing system with rate limiting and retry logic
- Specialized methods for each application feature:
  - `analyzeDDL()` - Database schema migration analysis
  - `translateText()` - Multi-language translation with style options
  - `analyzeCapacity()` - Database storage capacity calculations
  - `generatePlantUMLDiagram()` - Technical diagram generation

#### Configuration Management (`src/contexts/ConfigContext.tsx`)
- Centralized configuration with localStorage persistence
- Encrypted API key storage using custom encryption utilities
- Per-page model selection for different AI capabilities
- Multi-feature history management (DDL, translation, capacity, diagrams)
- Queue configuration for API rate limiting

#### Type System
The application uses comprehensive TypeScript definitions in `src/types/`:
- `capacity.ts` - Database capacity analysis structures
- `translation.ts` - Translation request/response types
- `diagram.ts` - Diagram generation types
- `history.ts` - Application history management

## Important Implementation Details

### API Key Security
- API keys are encrypted before localStorage storage using `src/lib/encryption.ts`
- Keys are decrypted only when needed for API calls
- Never log or expose API keys in development

### Multi-Step Workflows
The CapacityAnalysis component implements both classic and 3-step analysis workflows:
- **Classic mode**: Single comprehensive analysis
- **3-step mode**: DDL parsing → Structure editing → Final calculation
- Progress tracking with user-friendly error handling and retry mechanisms

### Internationalization
- Uses i18next with browser language detection
- Translation files in `src/i18n/locales/` (en.json, vi.json)
- Dynamic language switching with persistent preferences

### History Management
Each major feature maintains its own history with metadata:
- DDL comparison history with migration scripts
- Translation history with multi-language results
- Capacity analysis history with detailed breakdowns
- Diagram generation history with code and explanations

## Development Guidelines

### Component Development
- Use shadcn/ui components as building blocks
- Follow the existing pattern of feature-specific pages with shared UI components
- Implement proper error boundaries and loading states
- Use the `useConfig` hook for accessing global configuration and history

### API Integration
- Always use the `ChatGPTService` class for AI API calls
- Implement proper error handling with user-friendly messages
- Use the queue system for rate limiting (configured in `ConfigContext`)
- Validate API responses and handle malformed JSON gracefully

### State Management
- Use React Context for global state (configuration, history)
- Local component state for UI-specific data
- Persist important data to localStorage through the ConfigContext

### Styling
- Use TailwindCSS utility classes
- Follow the existing theme configuration in `tailwind.config.ts`
- Use shadcn/ui component variants for consistency
- Support both light and dark themes where applicable

## File Structure Notes

### Key Directories
- `src/components/ui/` - Contains the complete shadcn/ui component library
- `src/data/` - Static configuration data (diagram types, translation options, etc.)
- `src/lib/` - Core business logic separated from UI concerns
- `src/utils/` - Pure utility functions (Confluence export, encryption, etc.)

### Configuration Files
- `vite.config.ts` - Vite configuration with path aliases and development settings
- `tailwind.config.ts` - TailwindCSS theme and component configuration
- `components.json` - shadcn/ui component configuration

## Common Development Patterns

### Error Handling
```typescript
try {
  const result = await chatGPTService.someMethod();
  // Handle success
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  toast({ title: "Error", description: errorMessage, variant: "destructive" });
}
```

### History Management
```typescript
const { addToHistory } = useConfig();
addToHistory({
  title: "Analysis Name",
  // ... other required fields
});
```

### Page Model Selection
```typescript
const { getPageModel } = useConfig();
const pageModel = getPageModel("page-id");
// Use pageModel for AI API calls instead of global model
```

## Security Considerations

- API keys are encrypted at rest
- No sensitive data is logged to console in production
- Input validation on all user-provided data
- Secure handling of AI API responses with proper sanitization

## Update

Always update the CLAUDE.md file when there are changes.
