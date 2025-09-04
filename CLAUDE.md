# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on localhost:8080)
- **Build for production**: `npm run build`
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Project Architecture

This is a React-based DDL (Database Definition Language) comparison and migration tool that uses ChatGPT/OpenAI API to generate database migration scripts.

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
- BrowserRouter with routes: `/` (DDLCompare), `/settings` (Settings)

**Configuration System** (`src/contexts/ConfigContext.tsx`):
- Manages ChatGPT API configuration (API key, model, server URL, etc.)
- Auto-saves to localStorage with key `ddl-tool-config`
- Default model: `gpt-4-turbo`
- Default server: `https://api.openai.com/v1`

**ChatGPT Integration** (`src/lib/chatgpt.ts`):
- `ChatGPTService` class handles OpenAI API communication
- `analyzeDDL()` method generates migration scripts by comparing two DDL schemas
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

### File Organization

- `/src/pages/`: Main application pages (DDLCompare, Settings, NotFound)
- `/src/components/ui/`: shadcn/ui component library
- `/src/components/layout/`: Layout components (AppLayout, Sidebar)
- `/src/contexts/`: React context providers
- `/src/lib/`: Utility functions and service classes
- `/src/hooks/`: Custom React hooks

### Important Implementation Notes

- The application uses Vietnamese language for user interface
- All API communication includes proper error handling with Vietnamese messages  
- Configuration is persisted automatically using localStorage
- The app supports both global model configuration and per-page model selection
- Database type selection affects the generated migration script format