const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

class GeminiService {
  async generateTestCaseSummaries(files, testFramework) {
    const filesContext = files.map(file => 
      `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
    ).join('\n\n');

    const frameworkPrompts = {
      "Jest (React)": "React component testing with Jest and React Testing Library",
      "Cypress": "End-to-end testing with Cypress for web applications",
      "Selenium": "Browser automation testing with Selenium WebDriver",
      "Playwright": "Modern browser testing with Playwright",
      "Pytest": "Python unit and integration testing with Pytest",
      "JUnit": "Java unit testing with JUnit framework",
      "Mocha": "JavaScript testing with Mocha framework"
    };

    const frameworkDescription = frameworkPrompts[testFramework] || "comprehensive testing";

    const prompt = `Analyze the following code files and generate comprehensive test case summaries for ${frameworkDescription}.

${filesContext}

Generate 4-6 test case summaries that cover:
1. Component/function rendering and basic functionality
2. User interactions and event handling  
3. State management and data flow
4. Error handling and edge cases
5. Integration testing if applicable
6. Performance testing if relevant

For each test case summary, provide:
- A descriptive title
- A detailed description of what will be tested
- Priority level (high/medium/low)
- Number of individual test cases
- Estimated time to run tests
- Which files are involved
- Test category/type (unit/integration/e2e/performance)

Return the response as a JSON array of test case summaries.`;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent(prompt);
    
    const rawJson = response.response.text();
    if (rawJson) {
      return JSON.parse(rawJson);
    }
    
    throw new Error("Failed to generate test case summaries");
  }

  async generateBatchTestCases(files, testFramework) {
    const filesContext = files.map(file => 
      `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
    ).join('\n\n');

    const prompt = `Analyze ALL the following code files and generate a comprehensive test suite for ${testFramework}.

${filesContext}

Generate a complete batch test strategy covering:
1. Individual component/function tests
2. Integration tests between components
3. End-to-end workflow tests
4. Edge case and error handling tests
5. Performance and load tests where applicable

For the entire codebase, provide:
- Overall test strategy description
- Recommended test structure and organization
- Critical test paths and scenarios
- Performance considerations
- Suggested test data and mocking strategies

Return as JSON with test summaries for the entire repository.`;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent(prompt);
    
    const rawJson = response.response.text();
    if (rawJson) {
      return JSON.parse(rawJson);
    }
    
    throw new Error("Failed to generate batch test cases");
  }

  async generateTestCode(summary, files, testFramework, template = null) {
    const filesContext = files
      .filter(file => summary.files.includes(file.path))
      .map(file => 
        `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
      ).join('\n\n');

    let basePrompt = `Generate comprehensive test code for the following test case summary using ${testFramework}:

Test Case Summary:
Title: ${summary.title}
Description: ${summary.description}
Priority: ${summary.priority}
Category: ${summary.category}

Source Files:
${filesContext}

Requirements:
1. Generate complete, runnable test code
2. Include proper imports and setup
3. Cover all scenarios mentioned in the description
4. Follow ${testFramework} best practices
5. Include meaningful test names and descriptions
6. Add appropriate assertions and expectations
7. Handle async operations if needed
8. Include setup/teardown if necessary
9. Add data-testid attributes for UI elements when applicable
10. Include performance tests if category is 'performance'
11. Add accessibility tests for UI components
12. Include error boundary tests for React components`;

    if (template) {
      basePrompt += `\n\nUse this template as a starting point:\n${template.template}`;
    }

    basePrompt += `\n\nGenerate the test file content as a string.`;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent(basePrompt);
    
    const code = response.response.text();
    if (!code) {
      throw new Error("Failed to generate test code");
    }

    // Determine filename based on framework and category
    const firstFile = summary.files[0] || 'component';
    const baseName = firstFile.split('/').pop()?.split('.')[0] || 'test';
    
    let extension;
    switch (testFramework) {
      case 'Jest (React)':
        extension = summary.category === 'e2e' ? 'e2e.test.js' : 'test.js';
        break;
      case 'Cypress':
        extension = 'cy.js';
        break;
      case 'Selenium':
        extension = 'selenium.test.js';
        break;
      case 'Playwright':
        extension = 'spec.js';
        break;
      case 'Pytest':
        extension = 'test.py';
        break;
      case 'JUnit':
        extension = 'Test.java';
        break;
      default:
        extension = 'test.js';
    }
    
    return {
      filename: `${baseName}.${extension}`,
      content: code,
      framework: testFramework,
      language: files[0]?.language || 'javascript',
      category: summary.category
    };
  }

  async generateCustomTestCode(customPrompt, files, testFramework) {
    const filesContext = files.map(file => 
      `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
    ).join('\n\n');

    const prompt = `${customPrompt}

Source Files:
${filesContext}

Framework: ${testFramework}

Generate comprehensive test code based on the custom requirements above.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const code = response.text;
    if (!code) {
      throw new Error("Failed to generate custom test code");
    }

    return {
      filename: 'custom-test.js',
      content: code,
      framework: testFramework,
      language: 'javascript'
    };
  }

  async optimizeTestCode(originalCode, optimizationGoals) {
    const prompt = `Optimize the following test code based on these goals: ${optimizationGoals.join(', ')}

Original Test Code:
\`\`\`
${originalCode}
\`\`\`

Provide optimized version with:
1. Better performance
2. Improved readability
3. Enhanced maintainability
4. Reduced test execution time
5. Better error messages
6. More comprehensive coverage

Return only the optimized code.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || originalCode;
  }

  async generateTestDocumentation(testCases, testFramework) {
    const testCasesContext = testCases.map(tc => 
      `- ${tc.title}: ${tc.description}`
    ).join('\n');

    const prompt = `Generate comprehensive test documentation for ${testFramework} test suite:

Test Cases:
${testCasesContext}

Include:
1. Test suite overview
2. Setup and configuration instructions
3. How to run tests
4. Test coverage expectations
5. Continuous integration setup
6. Troubleshooting guide
7. Best practices

Format as markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "# Test Documentation\n\nGenerated test documentation.";
  }
}

const geminiService = new GeminiService();

module.exports = {
  GeminiService,
  geminiService,
};