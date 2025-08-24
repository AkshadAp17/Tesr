# TestGen AI Pro - Enhanced Test Case Generator

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)](https://reactjs.org/)

</div>

## 👋 About Me

<div align="center">

### Hi there! 👋 I'm Akshad Apastambh

<div class="sliding-text">
  
**🚀 Full Stack Developer | 🧠 Problem Solver | 350+ DSA Problems Solved**

**🤖 AI & Web Development Enthusiast | 💻 Always Learning**

</div>

---

</div>

<style>
.sliding-text {
  overflow: hidden;
  white-space: nowrap;
  animation: slideIn 2s ease-in-out;
}

@keyframes slideIn {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

.sliding-text strong {
  display: inline-block;
  animation: textGlow 3s ease-in-out infinite alternate;
}

@keyframes textGlow {
  0% {
    text-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  }
  100% {
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
  }
}
</style>

A comprehensive full-stack web application that helps developers generate AI-powered test cases for their GitHub repositories. TestGen AI Pro supports multiple testing frameworks, offers batch processing capabilities, and integrates seamlessly with GitHub for automated pull request creation.

## ✨ Features

### 🚀 **AI-Powered Test Generation**
- Generate comprehensive test cases using Google Gemini AI
- Analyze code files intelligently to create relevant test scenarios
- Support for multiple test categories: Unit, Integration, E2E, and Performance tests

### 🧪 **Multiple Testing Framework Support**
- **Jest** - React component testing with React Testing Library
- **Cypress** - End-to-end testing for web applications
- **Selenium** - Browser automation testing with WebDriver
- **Playwright** - Modern cross-browser testing
- **Pytest** - Python unit and integration testing
- **JUnit** - Java unit testing framework
- **Mocha** - JavaScript testing framework

### 📦 **Advanced Processing Capabilities**
- **Batch Mode** - Process entire repositories for comprehensive test coverage
- **Smart File Selection** - Automatic detection and selection of code files
- **Custom Test Prompts** - Generate tests based on specific requirements
- **Template System** - Pre-built templates for different frameworks

### 🔗 **GitHub Integration**
- OAuth-based authentication with GitHub
- Automatic pull request creation with generated test files
- Branch management for test additions
- Framework-specific directory structure and naming conventions
- Comprehensive PR descriptions with test coverage details

### 🎨 **Enhanced User Experience**
- Step-by-step guided workflow
- Visual progress tracking
- Code preview and copy functionality
- Batch processing with progress indicators
- Enhanced error handling and troubleshooting guidance

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and development server
- **Wouter** - Lightweight client-side routing
- **TanStack Query** - Server state management and caching
- **Radix UI + shadcn/ui** - UI component library
- **Tailwind CSS** - Utility-first styling
- **React Hook Form + Zod** - Form handling and validation

### Backend
- **Node.js + Express.js** - Server runtime and framework
- **TypeScript/JavaScript** - Language support
- **PostgreSQL + Drizzle ORM** - Database and ORM
- **Neon Database** - Serverless PostgreSQL

### External Services
- **GitHub API** - Repository access and PR creation
- **Google Gemini AI** - Code analysis and test generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- PostgreSQL database (or Neon Database account)
- GitHub personal access token
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/testgen-ai-pro.git
   cd testgen-ai-pro
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` files in both `client` and `server` directories:

   **Server `.env`:**
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/testgen_db"
   
   # Google Gemini AI
   GEMINI_API_KEY="your_gemini_api_key_here"
   
   # GitHub OAuth
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

   **Client `.env`:**
   ```env
   VITE_API_BASE_URL="http://localhost:3001"
   VITE_GITHUB_CLIENT_ID="your_github_client_id"
   ```

4. **Database Setup**
   ```bash
   cd server
   npm run db:generate  # Generate migrations
   npm run db:migrate   # Run migrations
   ```

5. **Start the application**
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory, in a new terminal)
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

## 📋 Usage Guide

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

## 🧪 Supported Testing Frameworks

### Jest (React)
```javascript
// Example: Component testing with React Testing Library
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
// Example: End-to-end testing
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
// Example: Cross-browser testing
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
  await expect(page.locator('.hero-section')).toBeVisible();
});
```

### Pytest (Python)
```python
# Example: Python unit testing
import pytest
from myapp.calculator import Calculator

class TestCalculator:
    def setup_method(self):
        self.calc = Calculator()
    
    def test_addition(self):
        result = self.calc.add(2, 3)
        assert result == 5
```

## 📁 Project Structure

```
testgen-ai-pro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic services
│   │   ├── db/           # Database schema and migrations
│   │   └── middleware/    # Express middleware
│   └── package.json
├── shared/                # Shared types and utilities
│   ├── types/            # Common TypeScript types
│   └── schemas/          # Zod validation schemas
└── README.md
```

## 🔧 Configuration

### Database Configuration
The application supports both PostgreSQL and in-memory storage for development:

```javascript
// Database connection (server/src/db/connection.js)
const connectionString = process.env.DATABASE_URL || 'fallback-to-memory';
```

### AI Model Configuration
Configure Google Gemini AI settings:

```javascript
// AI service configuration (server/src/services/gemini.js)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

## 🚀 Deployment

### Environment Setup
1. Set up production environment variables
2. Configure database for production
3. Set up GitHub OAuth application
4. Deploy to your preferred platform (Vercel, Netlify, Railway, etc.)

### Docker Deployment (Optional)
```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed

## 📊 Performance

- **Fast Test Generation**: Optimized AI prompts for quick response times
- **Efficient Caching**: TanStack Query for intelligent data caching
- **Batch Processing**: Handle large repositories efficiently
- **Rate Limit Handling**: Built-in GitHub API rate limit management

## 🐛 Troubleshooting

### Common Issues

**Issue**: GitHub authentication fails
**Solution**: Verify your GitHub OAuth app configuration and client ID/secret

**Issue**: AI test generation is slow
**Solution**: Check your Gemini API key and rate limits

**Issue**: Database connection errors
**Solution**: Verify your PostgreSQL connection string and database permissions

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=testgen:*
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📧 Email: support@testgen-ai-pro.com
- 💬 Discord: [Join our community](https://discord.gg/testgen-ai-pro)
- 📖 Documentation: [Full docs](https://docs.testgen-ai-pro.com)
- 🐛 Bug reports: [GitHub Issues](https://github.com/yourusername/testgen-ai-pro/issues)

## 🚧 Roadmap

- [ ] Support for additional testing frameworks (Vitest, AVA)
- [ ] Visual test coverage reporting
- [ ] Integration with CI/CD pipelines
- [ ] Custom test template editor
- [ ] Team collaboration features
- [ ] API rate limit dashboard
- [ ] Advanced code analysis metrics

---

**Built with ❤️ by the TestGen AI Pro team**
