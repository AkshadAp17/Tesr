# TestGen AI Pro - Enhanced Test Case Generator

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)

### 🌐 [**Live Demo - Try TestGen AI Pro**](https://tesr-plmv.onrender.com)

</div>



---


## 🌟 Overview

A comprehensive full-stack web application that helps developers generate AI-powered test cases for their GitHub repositories. The enhanced version now includes advanced features like batch test generation, multiple testing framework support (Jest, Cypress, Selenium, Playwright, Pytest, JUnit, Mocha), GitHub pull request creation, customizable test generation, and a streamlined user interface with step-by-step workflow guidance.

### 📢 User Preferences
**Preferred communication style**: Simple, everyday language.

---

## 🏗️ System Architecture

### 🎨 Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation resolvers

The frontend follows a component-based architecture with clear separation of concerns. Components are organized into UI primitives, feature-specific components, and page components. The application uses modern React patterns with hooks and context for state management.

### ⚙️ Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for development server with hot reloading
- **Build**: esbuild for production bundling
- **API Design**: RESTful API with structured route handlers

The server uses a modular architecture with separate route handlers, service layers, and storage abstractions. It implements middleware for logging, error handling, and request processing.

### 💾 Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL via `@neondatabase/serverless`
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Fallback Storage**: In-memory storage implementation for development/testing

**Database Schema Entities**:
- `repositories` - GitHub repository metadata and access tokens
- `repository_files` - File contents and selection state for test generation
- `test_case_summaries` - AI-generated test case summaries with metadata

### 🔐 Authentication and Authorization
- **GitHub Integration**: OAuth-based authentication using GitHub personal access tokens
- **Token Storage**: Repository-level access token storage for GitHub API access
- **API Security**: Bearer token authentication for GitHub API requests

### 🌐 External Service Integrations

#### 📊 GitHub API Integration
- **Purpose**: Repository browsing, file content retrieval, and pull request creation
- **Implementation**: Custom GitHubService class with REST API client
- **Features**: Repository listing, file tree navigation, content fetching
- **Rate Limiting**: Built-in GitHub API rate limit handling

#### 🤖 Google Gemini AI Integration
- **Purpose**: Code analysis and test case generation
- **Implementation**: GeminiService using `@google/genai` SDK
- **Capabilities**: 
  - Analyze code files to generate test case summaries
  - Generate actual test code based on selected frameworks
  - Support for multiple testing frameworks (Jest, Vitest, etc.)
- **Prompt Engineering**: Structured prompts for consistent AI responses

#### 🛠️ Development Tools Integration
- **Replit**: Runtime error overlay and cartographer plugins for Replit environment
- **Vite**: Development server with HMR and production build optimization
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

---

## 🎯 Design Patterns and Architectural Decisions

### 📁 Monorepo Structure
```
testgen-ai-pro/
├── /client          # React frontend application
├── /server           # Express backend application  
└── /shared           # Shared TypeScript types and schemas
```

### 🔒 Type Safety Strategy
- Drizzle ORM with TypeScript for database operations
- Zod schemas for runtime validation and type inference
- Shared type definitions between frontend and backend
- Path aliases for clean import statements

### 📊 State Management Pattern
- Server state managed by TanStack Query with automatic caching
- Local UI state managed by React hooks and context
- Form state handled by React Hook Form with validation

### 🚀 API Design Philosophy
- RESTful endpoints with clear resource naming
- Consistent error handling and response formats
- Request/response logging middleware for debugging
- Type-safe request/response handling with Zod validation

The architecture prioritizes type safety, developer experience, and maintainability while providing a scalable foundation for AI-powered code analysis and test generation workflows.

---

## ✨ Enhanced Features (Latest Updates)

### 🧪 New Testing Framework Support
- **Jest (React)** - React component testing with React Testing Library
- **Cypress** - End-to-end testing for web applications  
- **Selenium** - Browser automation testing with WebDriver
- **Playwright** - Modern browser testing with cross-browser support
- **Pytest** - Python unit and integration testing
- **JUnit** - Java unit testing framework
- **Mocha** - JavaScript testing framework

### 🚀 Advanced Test Generation Capabilities
- **Batch Mode** - Automatically process entire repositories for comprehensive test coverage
- **Custom Test Prompts** - Generate tests based on specific user requirements and scenarios
- **Template System** - Pre-built test templates for different frameworks and test categories
- **Multi-Category Support** - Unit, Integration, E2E, and Performance test generation
- **Smart File Selection** - Automatic detection and selection of code files for testing

### 🔗 GitHub Integration Enhancements
- **Pull Request Creation** - Automatically create PRs with generated test files
- **Branch Management** - Create feature branches for test additions
- **Test File Organization** - Framework-specific directory structure and naming conventions
- **Comprehensive PR Descriptions** - Detailed documentation of generated tests and coverage

### 🎨 User Experience Improvements
- **Step-by-Step Workflow** - Guided process from setup to code generation
- **Progress Tracking** - Visual indicators for each stage of test generation
- **Batch Processing** - Handle multiple files and large repositories efficiently
- **Code Preview** - View and copy generated test code before creating PRs
- **Enhanced Error Handling** - Detailed feedback and troubleshooting guidance

### 📖 Documentation and User Experience (August 13, 2025)
- **Comprehensive README** - Created detailed documentation explaining website features, workflows, and implementation guides
- **User Navigation Enhancement** - Added "View Results & Code" button for seamless workflow navigation
- **Complete Implementation Guides** - Step-by-step instructions for all supported testing frameworks
- **Example-Rich Documentation** - Real-world examples showing input/output and file placement

### 🔄 Backend Architecture Conversion
- **JavaScript Migration** - Converted from TypeScript to JavaScript as requested
- **Enhanced Storage System** - Improved in-memory storage with template management
- **Advanced API Endpoints** - Support for batch operations and custom test generation
- **Service Layer Improvements** - Enhanced GitHub and Gemini service integration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- PostgreSQL database (or Neon Database account)
- GitHub personal access token
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkshadAp17/testgen-ai-pro.git
   cd testgen-ai-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

3. **Environment Setup**
   
   **Server `.env`:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/testgen_db"
   GEMINI_API_KEY="your_gemini_api_key_here"
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"
   PORT=3001
   NODE_ENV=development
   ```

   **Client `.env`:**
   ```env
   VITE_API_BASE_URL="http://localhost:3001"
   VITE_GITHUB_CLIENT_ID="your_github_client_id"
   ```

4. **Start the application**
   ```bash
   # Backend (from server directory)
   npm run dev

   # Frontend (from client directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`
   - **Live Demo**: [https://tesr-plmv.onrender.com](https://tesr-plmv.onrender.com)

---

## 📚 Usage Guide

### Step 1: Authentication
1. Navigate to the application
2. Click "Connect with GitHub"
3. Authorize the application with your GitHub account

### Step 2: Repository Setup
1. Select a repository from your GitHub account
2. Choose the files you want to generate tests for
3. Configure test generation settings

### Step 3: Test Generation
1. Select your preferred testing framework(s)
2. Choose test categories (Unit, Integration, E2E, Performance)
3. Add custom test requirements (optional)
4. Click "Generate Tests"

### Step 4: Review & Deploy
1. Review generated test code
2. Make any necessary modifications
3. Create a pull request directly from the interface
4. Monitor the PR creation process

---

## 🧪 Framework Examples

### Jest (React)
```javascript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile Component', () => {
  test('renders user name correctly', () => {
    render(<UserProfile name="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Cypress (E2E)
```javascript
// End-to-end testing
describe('User Registration Flow', () => {
  it('should allow user to register successfully', () => {
    cy.visit('/register');
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('securePassword123');
    cy.get('[data-testid="submit-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

### Playwright
```javascript
// Cross-browser testing
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
  await expect(page.locator('.hero-section')).toBeVisible();
});
```

### Pytest (Python)
```python
# Python unit testing
import pytest
from myapp.calculator import Calculator

class TestCalculator:
    def setup_method(self):
        self.calc = Calculator()
    
    def test_addition(self):
        result = self.calc.add(2, 3)
        assert result == 5
```

---

## 📊 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and development server
- **Wouter** - Lightweight client-side routing
- **TanStack Query** - Server state management
- **Radix UI + shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Form handling

### Backend
- **Node.js + Express.js** - Server runtime
- **TypeScript/JavaScript** - Language support
- **PostgreSQL + Drizzle ORM** - Database
- **Neon Database** - Serverless PostgreSQL

### External Services
- **GitHub API** - Repository access and PR creation
- **Google Gemini AI** - Code analysis and test generation

---

## 🚧 Roadmap

- [ ] Support for additional testing frameworks (Vitest, AVA)
- [ ] Visual test coverage reporting
- [ ] Integration with CI/CD pipelines
- [ ] Custom test template editor
- [ ] Team collaboration features
- [ ] API rate limit dashboard
- [ ] Advanced code analysis metrics

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request


---

**Built with ❤️ by Akshad Apastambh**

*Turning code into comprehensive test suites with the power of AI* 🚀

</div>
