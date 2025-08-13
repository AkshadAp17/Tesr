const {
  repositories,
  repositoryFiles,
  testCaseSummaries,
  testTemplates,
} = require("../shared/schema");
const { randomUUID } = require("crypto");

class MemStorage {
  constructor() {
    this.repositories = new Map();
    this.repositoryFiles = new Map();
    this.testCaseSummaries = new Map();
    this.testTemplates = new Map();
    this.initializeTemplates();
  }

  // Initialize default test templates for different frameworks
  initializeTemplates() {
    const defaultTemplates = [
      {
        framework: "Jest (React)",
        category: "unit",
        template: `import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {{COMPONENT_NAME}} from './{{COMPONENT_PATH}}';

describe('{{COMPONENT_NAME}}', () => {
  test('renders without crashing', () => {
    render(<{{COMPONENT_NAME}} />);
    expect(screen.getByText(/{{EXPECTED_TEXT}}/i)).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    render(<{{COMPONENT_NAME}} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Add assertions here
  });
});`,
        description: "React component testing with Jest and React Testing Library"
      },
      {
        framework: "Cypress",
        category: "e2e",
        template: `describe('{{TEST_SUITE_NAME}}', () => {
  beforeEach(() => {
    cy.visit('{{BASE_URL}}');
  });

  it('should {{TEST_DESCRIPTION}}', () => {
    cy.get('[data-testid="{{ELEMENT_ID}}"]').should('be.visible');
    cy.get('[data-testid="{{BUTTON_ID}}"]').click();
    cy.url().should('include', '{{EXPECTED_URL}}');
  });

  it('should handle form submission', () => {
    cy.get('[data-testid="{{INPUT_ID}}"]').type('{{TEST_INPUT}}');
    cy.get('[data-testid="{{SUBMIT_BUTTON}}"]').click();
    cy.get('[data-testid="{{SUCCESS_MESSAGE}}"]').should('contain', '{{EXPECTED_MESSAGE}}');
  });
});`,
        description: "End-to-end testing with Cypress"
      },
      {
        framework: "Selenium",
        category: "e2e",
        template: `const { Builder, By, until } = require('selenium-webdriver');

describe('{{TEST_SUITE_NAME}}', function() {
  let driver;

  before(async function() {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function() {
    await driver.quit();
  });

  it('should {{TEST_DESCRIPTION}}', async function() {
    await driver.get('{{BASE_URL}}');
    
    const element = await driver.findElement(By.css('[data-testid="{{ELEMENT_ID}}"]'));
    await driver.wait(until.elementIsVisible(element), 10000);
    
    await element.click();
    
    const resultElement = await driver.findElement(By.css('[data-testid="{{RESULT_ID}}"]'));
    const text = await resultElement.getText();
    assert.equal(text, '{{EXPECTED_TEXT}}');
  });
});`,
        description: "Browser automation testing with Selenium WebDriver"
      },
      {
        framework: "Playwright",
        category: "e2e",
        template: `const { test, expect } = require('@playwright/test');

test.describe('{{TEST_SUITE_NAME}}', () => {
  test('should {{TEST_DESCRIPTION}}', async ({ page }) => {
    await page.goto('{{BASE_URL}}');
    
    await page.locator('[data-testid="{{ELEMENT_ID}}"]').waitFor();
    await page.locator('[data-testid="{{BUTTON_ID}}"]').click();
    
    await expect(page.locator('[data-testid="{{RESULT_ID}}"]')).toHaveText('{{EXPECTED_TEXT}}');
  });

  test('should handle responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('{{BASE_URL}}');
    
    await expect(page.locator('[data-testid="{{MOBILE_MENU}}"]')).toBeVisible();
  });
});`,
        description: "Modern browser testing with Playwright"
      },
      {
        framework: "Pytest",
        category: "unit",
        template: `import pytest
from {{MODULE_NAME}} import {{FUNCTION_NAME}}

class Test{{CLASS_NAME}}:
    def setup_method(self):
        """Setup test fixtures before each test method."""
        pass

    def test_{{FUNCTION_NAME}}_returns_expected_result(self):
        """Test that {{FUNCTION_NAME}} returns the expected result."""
        # Arrange
        input_data = {{TEST_INPUT}}
        expected_result = {{EXPECTED_OUTPUT}}
        
        # Act
        result = {{FUNCTION_NAME}}(input_data)
        
        # Assert
        assert result == expected_result

    def test_{{FUNCTION_NAME}}_handles_edge_cases(self):
        """Test that {{FUNCTION_NAME}} handles edge cases properly."""
        with pytest.raises({{EXPECTED_EXCEPTION}}):
            {{FUNCTION_NAME}}({{INVALID_INPUT}})

    @pytest.mark.parametrize("input_value,expected", [
        ({{TEST_CASE_1}}),
        ({{TEST_CASE_2}}),
        ({{TEST_CASE_3}}),
    ])
    def test_{{FUNCTION_NAME}}_parametrized(self, input_value, expected):
        """Parametrized test for multiple input scenarios."""
        assert {{FUNCTION_NAME}}(input_value) == expected`,
        description: "Python unit testing with Pytest"
      }
    ];

    defaultTemplates.forEach(template => {
      const id = randomUUID();
      this.testTemplates.set(id, {
        ...template,
        id,
        createdAt: new Date(),
      });
    });
  }

  // Repository operations
  async getRepository(id) {
    return this.repositories.get(id);
  }

  async getRepositories() {
    return Array.from(this.repositories.values());
  }

  async createRepository(repo) {
    const id = randomUUID();
    const repository = {
      ...repo,
      id,
      createdAt: new Date(),
      description: repo.description || null,
      language: repo.language || null,
      accessToken: repo.accessToken || null,
      isPrivate: repo.isPrivate || false,
    };
    this.repositories.set(id, repository);
    return repository;
  }

  async updateRepository(id, repo) {
    const existing = this.repositories.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...repo };
    this.repositories.set(id, updated);
    return updated;
  }

  // File operations
  async getRepositoryFiles(repositoryId) {
    return Array.from(this.repositoryFiles.values()).filter(
      file => file.repositoryId === repositoryId
    );
  }

  async createRepositoryFile(file) {
    const id = randomUUID();
    const repositoryFile = { 
      ...file, 
      id,
      content: file.content || null,
      size: file.size || null,
      language: file.language || null,
      isSelected: file.isSelected || false,
    };
    this.repositoryFiles.set(id, repositoryFile);
    return repositoryFile;
  }

  async updateRepositoryFile(id, file) {
    const existing = this.repositoryFiles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...file };
    this.repositoryFiles.set(id, updated);
    return updated;
  }

  async getSelectedFiles(repositoryId) {
    return Array.from(this.repositoryFiles.values()).filter(
      file => file.repositoryId === repositoryId && file.isSelected
    );
  }

  async selectAllFiles(repositoryId) {
    const files = await this.getRepositoryFiles(repositoryId);
    const updatedFiles = [];
    
    for (const file of files) {
      if (file.type === 'file') {
        const updated = await this.updateRepositoryFile(file.id, { isSelected: true });
        if (updated) updatedFiles.push(updated);
      }
    }
    
    return updatedFiles;
  }

  async clearFileSelection(repositoryId) {
    const files = await this.getRepositoryFiles(repositoryId);
    const updatedFiles = [];
    
    for (const file of files) {
      if (file.isSelected) {
        const updated = await this.updateRepositoryFile(file.id, { isSelected: false });
        if (updated) updatedFiles.push(updated);
      }
    }
    
    return updatedFiles;
  }

  // Test case operations
  async getTestCaseSummaries(repositoryId) {
    return Array.from(this.testCaseSummaries.values()).filter(
      summary => summary.repositoryId === repositoryId
    );
  }

  async createTestCaseSummary(summary) {
    const id = randomUUID();
    const testCaseSummary = {
      id,
      repositoryId: summary.repositoryId,
      title: summary.title,
      description: summary.description,
      priority: summary.priority,
      testFramework: summary.testFramework,
      files: Array.isArray(summary.files) ? summary.files : [],
      testCaseCount: summary.testCaseCount,
      estimatedTime: summary.estimatedTime,
      generatedCode: summary.generatedCode || null,
      isCustomizable: summary.isCustomizable || true,
      category: summary.category || 'unit',
      createdAt: new Date(),
    };
    this.testCaseSummaries.set(id, testCaseSummary);
    return testCaseSummary;
  }

  async updateTestCaseSummary(id, summary) {
    const existing = this.testCaseSummaries.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...summary,
      files: summary.files ? (Array.isArray(summary.files) ? summary.files : []) : existing.files
    };
    this.testCaseSummaries.set(id, updated);
    return updated;
  }

  async getTestCaseSummary(id) {
    return this.testCaseSummaries.get(id);
  }

  async deleteTestCaseSummary(id) {
    return this.testCaseSummaries.delete(id);
  }

  async generateBatchTestCases(repositoryId) {
    const allFiles = await this.getRepositoryFiles(repositoryId);
    const codeFiles = allFiles.filter(file => 
      file.type === 'file' && 
      file.content && 
      this.isCodeFile(file.name)
    );

    // Auto-select code files for batch processing
    for (const file of codeFiles) {
      await this.updateRepositoryFile(file.id, { isSelected: true });
    }

    return codeFiles;
  }

  isCodeFile(filename) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.rb', '.go', '.rs'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  // Test template operations
  async getTestTemplates(framework, category) {
    const templates = Array.from(this.testTemplates.values());
    
    if (framework && category) {
      return templates.filter(t => t.framework === framework && t.category === category);
    } else if (framework) {
      return templates.filter(t => t.framework === framework);
    } else if (category) {
      return templates.filter(t => t.category === category);
    }
    
    return templates;
  }

  async createTestTemplate(template) {
    const id = randomUUID();
    const testTemplate = {
      ...template,
      id,
      createdAt: new Date(),
    };
    this.testTemplates.set(id, testTemplate);
    return testTemplate;
  }

  async getTestTemplate(id) {
    return this.testTemplates.get(id);
  }
}

const storage = new MemStorage();

module.exports = {
  MemStorage,
  storage,
};