# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on localhost:8080)
- **Build for production**: `npm run build`
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Project Architecture

This is a React-based AI-powered tool hub that includes DDL (Database Definition Language) comparison and multi-language translation capabilities using ChatGPT/OpenAI API.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Context + localStorage for configuration
- **HTTP Client**: Native fetch API
- **Routing**: React Router DOM

### Core Application Structure

**Main App Entry** (`src/App.tsx`):
- Wrapped with QueryClientProvider (TanStack Query)
- ConfigProvider for global ChatGPT configuration
- BrowserRouter with routes: `/` (DDLCompare), `/translation` (Translation), `/settings` (Settings)

**Configuration System** (`src/contexts/ConfigContext.tsx`):
- Manages ChatGPT API configuration (API key, model, server URL, etc.)
- Auto-saves to localStorage with key `ddl-tool-config`
- Default model: `gpt-4-turbo`
- Default server: `https://api.openai.com/v1`

**ChatGPT Integration** (`src/lib/chatgpt.ts`):
- `ChatGPTService` class handles OpenAI API communication
- `analyzeDDL()` method generates migration scripts by comparing two DDL schemas
- `translateText()` method provides multi-language translation with style options
- Supports custom model selection per request
- Vietnamese language prompts and error messages

### Key Features

**DDL Analysis Flow**:
1. User inputs current DDL and target DDL schemas
2. Selects database type (MySQL, PostgreSQL, SQL Server, Oracle, SQLite)  
3. Optionally selects a specific ChatGPT model for the analysis
4. System sends structured prompts to ChatGPT API
5. Returns SQL migration script with comments and proper ordering

**Configuration Management**:
- Global settings stored in ConfigContext
- Per-page model selection via ModelSelector component
- API key validation before analysis
- Auto-save configuration changes

**Multi-Language Translation** (`src/pages/Translation.tsx`, `src/types/translation.ts`):
- AI-powered translation supporting 25+ languages including Vietnamese, English, Chinese, Japanese, Korean, etc.
- 10 specialized translation styles: Natural, Formal, Casual, Literal, Creative, Technical, Poetic, Commercial, Academic, News
- Each style includes detailed description and specific AI prompts for optimal results
- Language swap functionality and auto-detection for source language
- Per-page model selection with fallback to global settings
- Real-time character count and copy-to-clipboard functionality

**Analysis History** (`src/types/history.ts`, `src/components/AnalysisHistory.tsx`):
- Automatically saves all successful DDL analyses to localStorage (`ddl-tool-history`)
- History includes: title, DDL inputs, database type, model used, migration script, and metadata
- History sidebar accessible from DDLCompare page with search and filter capabilities
- Users can load previous analyses to reuse or create new requests
- Export functionality to backup history as JSON
- Maximum 100 items stored (oldest automatically removed)

### File Organization

- `/src/pages/`: Main application pages (DDLCompare, Translation, Settings, NotFound)
- `/src/components/ui/`: shadcn/ui component library
- `/src/components/layout/`: Layout components (AppLayout, Sidebar)
- `/src/components/`: Core components (ModelSelector, AnalysisHistory)
- `/src/contexts/`: React context providers
- `/src/lib/`: Utility functions and service classes
- `/src/hooks/`: Custom React hooks
- `/src/types/`: TypeScript type definitions (history, translation)
- `/src/data/`: Static data and configuration (translation languages and styles)

### Important Implementation Notes

- The application uses Vietnamese language for user interface
- All API communication includes proper error handling with Vietnamese messages  
- Configuration is persisted automatically using localStorage
- The app supports both global model configuration and per-page model selection
- Database type selection affects the generated migration script format
- Translation feature supports 25+ languages with 10 specialized translation styles
- Each translation style has detailed descriptions and optimized AI prompts
- Language detection and swap functionality for efficient translation workflow