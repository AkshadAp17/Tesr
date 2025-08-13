import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TestCaseSummary {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  testCaseCount: string;
  estimatedTime: string;
  files: string[];
  category: string;
}

export interface GeneratedTestCode {
  filename: string;
  content: string;
  framework: string;
  language: string;
}

export class GeminiService {
  async generateTestCaseSummaries(
    files: Array<{ path: string; content: string; language: string }>,
    testFramework: string
  ): Promise<TestCaseSummary[]> {
    const filesContext = files.map(file => 
      `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
    ).join('\n\n');

    const prompt = `Analyze the following code files and generate comprehensive test case summaries for ${testFramework} testing framework.

${filesContext}

Generate 3-5 test case summaries that cover:
1. Component/function rendering and basic functionality
2. User interactions and event handling
3. State management and data flow
4. Error handling and edge cases
5. Integration testing if applicable

For each test case summary, provide:
- A descriptive title
- A detailed description of what will be tested
- Priority level (high/medium/low)
- Number of individual test cases
- Estimated time to run tests
- Which files are involved
- Test category/type

Return the response as a JSON array of test case summaries.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              testCaseCount: { type: "string" },
              estimatedTime: { type: "string" },
              files: { type: "array", items: { type: "string" } },
              category: { type: "string" }
            },
            required: ["title", "description", "priority", "testCaseCount", "estimatedTime", "files", "category"]
          }
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }
    
    throw new Error("Failed to generate test case summaries");
  }

  async generateTestCode(
    summary: TestCaseSummary,
    files: Array<{ path: string; content: string; language: string }>,
    testFramework: string
  ): Promise<GeneratedTestCode> {
    const filesContext = files
      .filter(file => summary.files.includes(file.path))
      .map(file => 
        `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
      ).join('\n\n');

    const prompt = `Generate comprehensive test code for the following test case summary using ${testFramework}:

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

Generate the test file content as a string.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const code = response.text;
    if (!code) {
      throw new Error("Failed to generate test code");
    }

    // Determine filename based on first file in summary
    const firstFile = summary.files[0] || 'component';
    const baseName = firstFile.split('/').pop()?.split('.')[0] || 'test';
    const extension = testFramework.toLowerCase().includes('jest') ? 'test.js' : 
                     testFramework.toLowerCase().includes('pytest') ? 'test.py' :
                     testFramework.toLowerCase().includes('junit') ? 'Test.java' : 'test.js';
    
    return {
      filename: `${baseName}.${extension}`,
      content: code,
      framework: testFramework,
      language: files[0]?.language || 'javascript'
    };
  }
}

export const geminiService = new GeminiService();
