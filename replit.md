# REST Express Test Generator

## Overview

A full-stack web application that helps developers generate comprehensive test cases for their GitHub repositories using AI. The application integrates with GitHub to browse repository files, uses Google's Gemini AI to analyze code and generate test case summaries, and provides a complete workflow from test planning to code generation with optional pull request creation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation resolvers

The frontend follows a component-based architecture with clear separation of concerns. Components are organized into UI primitives, feature-specific components, and page components. The application uses a modern React patterns with hooks and context for state management.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for development server with hot reloading
- **Build**: esbuild for production bundling
- **API Design**: RESTful API with structured route handlers

The server uses a modular architecture with separate route handlers, service layers, and storage abstractions. It implements middleware for logging, error handling, and request processing.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL via `@neondatabase/serverless`
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Fallback Storage**: In-memory storage implementation for development/testing

The database schema includes three main entities:
- `repositories` - GitHub repository metadata and access tokens
- `repository_files` - File contents and selection state for test generation
- `test_case_summaries` - AI-generated test case summaries with metadata

### Authentication and Authorization
- **GitHub Integration**: OAuth-based authentication using GitHub personal access tokens
- **Token Storage**: Repository-level access token storage for GitHub API access
- **API Security**: Bearer token authentication for GitHub API requests

### External Service Integrations

#### GitHub API Integration
- **Purpose**: Repository browsing, file content retrieval, and pull request creation
- **Implementation**: Custom GitHubService class with REST API client
- **Features**: Repository listing, file tree navigation, content fetching
- **Rate Limiting**: Built-in GitHub API rate limit handling

#### Google Gemini AI Integration
- **Purpose**: Code analysis and test case generation
- **Implementation**: GeminiService using `@google/genai` SDK
- **Capabilities**: 
  - Analyze code files to generate test case summaries
  - Generate actual test code based on selected frameworks
  - Support for multiple testing frameworks (Jest, Vitest, etc.)
- **Prompt Engineering**: Structured prompts for consistent AI responses

#### Development Tools Integration
- **Replit**: Runtime error overlay and cartographer plugins for Replit environment
- **Vite**: Development server with HMR and production build optimization
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

### Design Patterns and Architectural Decisions

#### Monorepo Structure
The application uses a monorepo structure with shared TypeScript schemas and utilities:
- `/client` - React frontend application
- `/server` - Express backend application  
- `/shared` - Shared TypeScript types and schemas

#### Type Safety Strategy
- Drizzle ORM with TypeScript for database operations
- Zod schemas for runtime validation and type inference
- Shared type definitions between frontend and backend
- Path aliases for clean import statements

#### State Management Pattern
- Server state managed by TanStack Query with automatic caching
- Local UI state managed by React hooks and context
- Form state handled by React Hook Form with validation

#### API Design Philosophy
- RESTful endpoints with clear resource naming
- Consistent error handling and response formats
- Request/response logging middleware for debugging
- Type-safe request/response handling with Zod validation

The architecture prioritizes type safety, developer experience, and maintainability while providing a scalable foundation for AI-powered code analysis and test generation workflows.