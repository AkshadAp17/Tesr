class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
  }

  async getUserRepositories(accessToken) {
    const response = await fetch(`${this.baseUrl}/user/repos?sort=updated&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRepositoryContents(owner, repo, path = '', accessToken) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  async getFileContent(owner, repo, path, accessToken) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    
    throw new Error('File content not available');
  }

  async createBranch(owner, repo, branchName, sourceBranch = 'main', accessToken) {
    // Get the SHA of the source branch
    const refResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${sourceBranch}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!refResponse.ok) {
      throw new Error(`Failed to get source branch: ${refResponse.status} ${refResponse.statusText}`);
    }

    const refData = await refResponse.json();
    const sourceSha = refData.object.sha;

    // Create new branch
    const createResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: sourceSha,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create branch: ${createResponse.status} ${createResponse.statusText}`);
    }

    return createResponse.json();
  }

  async createOrUpdateFile(owner, repo, path, content, message, branch, accessToken) {
    // Check if file exists to get its SHA
    let sha = null;
    try {
      const existingFile = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      
      if (existingFile.ok) {
        const fileData = await existingFile.json();
        sha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine for creation
    }

    const body = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to create/update file: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createPullRequest(owner, repo, title, body, head, base, accessToken) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createTestFilePR(owner, repo, testFiles, framework, accessToken) {
    const branchName = `feature/test-cases-${framework.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`;
    const baseBranch = 'main';

    try {
      // 1. Create new branch
      await this.createBranch(owner, repo, branchName, baseBranch, accessToken);

      // 2. Create test files in the new branch
      const commitPromises = testFiles.map(async (testFile, index) => {
        const testDir = this.getTestDirectory(framework);
        const filePath = `${testDir}/${testFile.filename}`;
        const commitMessage = `Add ${framework} test: ${testFile.filename}`;
        
        return this.createOrUpdateFile(
          owner, 
          repo, 
          filePath, 
          testFile.content, 
          commitMessage, 
          branchName, 
          accessToken
        );
      });

      await Promise.all(commitPromises);

      // 3. Create pull request
      const prTitle = `Add ${framework} test cases (${testFiles.length} files)`;
      const prBody = this.generatePRBody(testFiles, framework);

      const pr = await this.createPullRequest(
        owner,
        repo,
        prTitle,
        prBody,
        branchName,
        baseBranch,
        accessToken
      );

      return {
        pr,
        branch: branchName,
        files: testFiles.map(f => f.filename)
      };

    } catch (error) {
      throw new Error(`Failed to create test PR: ${error.message}`);
    }
  }

  getTestDirectory(framework) {
    const testDirs = {
      'Jest (React)': '__tests__',
      'Cypress': 'cypress/e2e',
      'Selenium': 'tests/selenium',
      'Playwright': 'tests/playwright',
      'Pytest': 'tests',
      'JUnit': 'src/test/java',
      'Mocha': 'test'
    };

    return testDirs[framework] || 'tests';
  }

  generatePRBody(testFiles, framework) {
    const fileList = testFiles.map(f => `- \`${f.filename}\` (${f.category || 'test'})`).join('\n');
    
    return `## Test Cases Generated with AI

This PR adds comprehensive test cases using **${framework}**.

### Generated Test Files:
${fileList}

### Features Covered:
- ✅ Unit tests for core functionality
- ✅ Integration tests for component interactions
- ✅ Error handling and edge cases
- ✅ Performance considerations
${framework.includes('Cypress') || framework.includes('Selenium') || framework.includes('Playwright') ? '- ✅ End-to-end user workflows' : ''}

### Test Execution:
\`\`\`bash
# Run all tests
${this.getTestCommand(framework)}

# Run specific test file
${this.getTestCommand(framework)} ${testFiles[0]?.filename || 'test-file'}
\`\`\`

### Quality Assurance:
- Tests follow ${framework} best practices
- Comprehensive coverage of critical paths  
- Includes data-testid attributes for reliable element selection
- Error boundary testing for React components
- Accessibility testing where applicable

Generated by TestGen AI 🤖`;
  }

  getTestCommand(framework) {
    const commands = {
      'Jest (React)': 'npm test',
      'Cypress': 'npx cypress run',
      'Selenium': 'npm run test:selenium',
      'Playwright': 'npx playwright test',
      'Pytest': 'pytest',
      'JUnit': 'mvn test',
      'Mocha': 'npm run test'
    };

    return commands[framework] || 'npm test';
  }

  getLanguageFromExtension(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[ext || ''] || 'text';
  }

  async getBranches(owner, repo, accessToken) {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRepoStats(owner, repo, accessToken) {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

const githubService = new GitHubService();

module.exports = {
  GitHubService,
  githubService,
};