const express = require('express');
const { createServer } = require('http');
const { storage } = require('./storage');
const { githubService } = require('./services/github');
const { geminiService } = require('./services/gemini');

async function registerRoutes(app) {
  // Repository routes
  app.get('/api/repositories', async (req, res) => {
    try {
      const repositories = await storage.getRepositories();
      res.json(repositories);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({ message: 'Failed to fetch repositories' });
    }
  });

  app.post('/api/repositories', async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: 'Access token is required' });
      }

      const githubRepos = await githubService.getUserRepositories(accessToken);
      const createdRepos = [];

      for (const githubRepo of githubRepos) {
        const existingRepo = await storage.getRepository(githubRepo.id.toString());
        if (!existingRepo) {
          const repo = await storage.createRepository({
            id: githubRepo.id.toString(),
            name: githubRepo.name,
            fullName: githubRepo.full_name,
            owner: githubRepo.owner.login,
            description: githubRepo.description,
            language: githubRepo.language,
            isPrivate: githubRepo.private,
            accessToken,
          });
          createdRepos.push(repo);
        }
      }

      res.json(createdRepos);
    } catch (error) {
      console.error('Error creating repositories:', error);
      res.status(500).json({ message: 'Failed to sync repositories' });
    }
  });

  app.put('/api/repositories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateRepository(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Repository not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating repository:', error);
      res.status(500).json({ message: 'Failed to update repository' });
    }
  });

  // File routes
  app.get('/api/repositories/:id/files', async (req, res) => {
    try {
      const { id } = req.params;
      const { path = '' } = req.query;
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // Get files from GitHub
      const githubFiles = await githubService.getRepositoryContents(
        repository.owner,
        repository.name,
        path,
        repository.accessToken
      );

      const files = [];
      for (const githubFile of githubFiles) {
        const existingFile = await storage.getRepositoryFiles(id);
        const existing = existingFile.find(f => f.path === githubFile.path);
        
        if (!existing) {
          const file = await storage.createRepositoryFile({
            repositoryId: id,
            path: githubFile.path,
            name: githubFile.name,
            type: githubFile.type,
            size: githubFile.size?.toString(),
            language: githubService.getLanguageFromExtension(githubFile.name),
          });
          files.push(file);
        } else {
          files.push(existing);
        }
      }

      res.json(files);
    } catch (error) {
      console.error('Error fetching repository files:', error);
      res.status(500).json({ message: 'Failed to fetch repository files' });
    }
  });

  app.get('/api/repositories/:id/files/:fileId/content', async (req, res) => {
    try {
      const { id, fileId } = req.params;
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      const files = await storage.getRepositoryFiles(id);
      const file = files.find(f => f.id === fileId);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      if (!file.content) {
        const content = await githubService.getFileContent(
          repository.owner,
          repository.name,
          file.path,
          repository.accessToken
        );
        
        await storage.updateRepositoryFile(fileId, { content });
        file.content = content;
      }

      res.json({ content: file.content });
    } catch (error) {
      console.error('Error fetching file content:', error);
      res.status(500).json({ message: 'Failed to fetch file content' });
    }
  });

  app.put('/api/repositories/:id/files/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const updated = await storage.updateRepositoryFile(fileId, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'File not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ message: 'Failed to update file' });
    }
  });

  app.get('/api/repositories/:id/files/selected', async (req, res) => {
    try {
      const { id } = req.params;
      const selectedFiles = await storage.getSelectedFiles(id);
      res.json(selectedFiles);
    } catch (error) {
      console.error('Error fetching selected files:', error);
      res.status(500).json({ message: 'Failed to fetch selected files' });
    }
  });

  app.post('/api/repositories/:id/files/select-all', async (req, res) => {
    try {
      const { id } = req.params;
      const files = await storage.selectAllFiles(id);
      res.json(files);
    } catch (error) {
      console.error('Error selecting all files:', error);
      res.status(500).json({ message: 'Failed to select all files' });
    }
  });

  app.post('/api/repositories/:id/files/clear-selection', async (req, res) => {
    try {
      const { id } = req.params;
      const files = await storage.clearFileSelection(id);
      res.json(files);
    } catch (error) {
      console.error('Error clearing file selection:', error);
      res.status(500).json({ message: 'Failed to clear file selection' });
    }
  });

  // Test case routes
  app.get('/api/repositories/:id/test-cases', async (req, res) => {
    try {
      const { id } = req.params;
      const testCases = await storage.getTestCaseSummaries(id);
      res.json(testCases);
    } catch (error) {
      console.error('Error fetching test cases:', error);
      res.status(500).json({ message: 'Failed to fetch test cases' });
    }
  });

  app.post('/api/repositories/:id/test-cases/generate', async (req, res) => {
    try {
      const { id } = req.params;
      const { testFramework } = req.body;

      if (!testFramework) {
        return res.status(400).json({ message: 'Test framework is required' });
      }

      const selectedFiles = await storage.getSelectedFiles(id);
      if (selectedFiles.length === 0) {
        return res.status(400).json({ message: 'No files selected for test generation' });
      }

      // Fetch content for all selected files
      const repository = await storage.getRepository(id);
      const filesWithContent = [];

      for (const file of selectedFiles) {
        if (!file.content) {
          const content = await githubService.getFileContent(
            repository.owner,
            repository.name,
            file.path,
            repository.accessToken
          );
          await storage.updateRepositoryFile(file.id, { content });
          file.content = content;
        }
        filesWithContent.push(file);
      }

      const summaries = await geminiService.generateTestCaseSummaries(filesWithContent, testFramework);
      const createdTestCases = [];

      for (const summary of summaries) {
        const testCase = await storage.createTestCaseSummary({
          repositoryId: id,
          testFramework,
          ...summary,
        });
        createdTestCases.push(testCase);
      }

      res.json(createdTestCases);
    } catch (error) {
      console.error('Error generating test cases:', error);
      res.status(500).json({ message: 'Failed to generate test cases: ' + error.message });
    }
  });

  app.post('/api/repositories/:id/test-cases/batch-generate', async (req, res) => {
    try {
      const { id } = req.params;
      const { testFramework } = req.body;

      if (!testFramework) {
        return res.status(400).json({ message: 'Test framework is required' });
      }

      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // Auto-select all code files for batch processing
      const codeFiles = await storage.generateBatchTestCases(id);
      
      // Fetch content for all code files
      const filesWithContent = [];
      for (const file of codeFiles) {
        if (!file.content) {
          const content = await githubService.getFileContent(
            repository.owner,
            repository.name,
            file.path,
            repository.accessToken
          );
          await storage.updateRepositoryFile(file.id, { content });
          file.content = content;
        }
        filesWithContent.push(file);
      }

      const batchResult = await geminiService.generateBatchTestCases(filesWithContent, testFramework);
      const createdTestCases = [];

      // Create test cases from batch result
      for (const summary of batchResult.testSuites || []) {
        const testCase = await storage.createTestCaseSummary({
          repositoryId: id,
          testFramework,
          ...summary,
        });
        createdTestCases.push(testCase);
      }

      res.json({
        strategy: batchResult.strategy,
        structure: batchResult.structure,
        criticalPaths: batchResult.criticalPaths,
        testCases: createdTestCases,
        filesProcessed: filesWithContent.length
      });
    } catch (error) {
      console.error('Error generating batch test cases:', error);
      res.status(500).json({ message: 'Failed to generate batch test cases: ' + error.message });
    }
  });

  app.post('/api/test-cases/:id/generate-code', async (req, res) => {
    try {
      const { id } = req.params;
      const { templateId } = req.body;

      const testCase = await storage.getTestCaseSummary(id);
      if (!testCase) {
        return res.status(404).json({ message: 'Test case not found' });
      }

      const repository = await storage.getRepository(testCase.repositoryId);
      const allFiles = await storage.getRepositoryFiles(testCase.repositoryId);
      const relevantFiles = allFiles.filter(file => testCase.files.includes(file.path));

      let template = null;
      if (templateId) {
        template = await storage.getTestTemplate(templateId);
      }

      const generatedCode = await geminiService.generateTestCode(
        testCase,
        relevantFiles,
        testCase.testFramework,
        template
      );

      const updatedTestCase = await storage.updateTestCaseSummary(id, {
        generatedCode: generatedCode.content
      });

      res.json({
        testCase: updatedTestCase,
        generatedCode
      });
    } catch (error) {
      console.error('Error generating test code:', error);
      res.status(500).json({ message: 'Failed to generate test code: ' + error.message });
    }
  });

  app.put('/api/test-cases/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateTestCaseSummary(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Test case not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating test case:', error);
      res.status(500).json({ message: 'Failed to update test case' });
    }
  });

  app.delete('/api/test-cases/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTestCaseSummary(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Test case not found' });
      }
      res.json({ message: 'Test case deleted successfully' });
    } catch (error) {
      console.error('Error deleting test case:', error);
      res.status(500).json({ message: 'Failed to delete test case' });
    }
  });

  // GitHub PR routes
  app.post('/api/repositories/:id/create-pr', async (req, res) => {
    try {
      const { id } = req.params;
      const { testCaseIds, prTitle, prDescription } = req.body;

      if (!testCaseIds || testCaseIds.length === 0) {
        return res.status(400).json({ message: 'Test case IDs are required' });
      }

      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // Get test cases and generate code if not already generated
      const testFiles = [];
      for (const testCaseId of testCaseIds) {
        const testCase = await storage.getTestCaseSummary(testCaseId);
        if (!testCase) continue;

        if (!testCase.generatedCode) {
          const allFiles = await storage.getRepositoryFiles(id);
          const relevantFiles = allFiles.filter(file => testCase.files.includes(file.path));
          
          const generatedCode = await geminiService.generateTestCode(
            testCase,
            relevantFiles,
            testCase.testFramework
          );
          
          await storage.updateTestCaseSummary(testCaseId, {
            generatedCode: generatedCode.content
          });

          testFiles.push(generatedCode);
        } else {
          // Create file object from existing generated code
          const firstFile = testCase.files[0] || 'component';
          const baseName = firstFile.split('/').pop()?.split('.')[0] || 'test';
          const extension = testCase.testFramework.includes('Pytest') ? 'test.py' : 'test.js';
          
          testFiles.push({
            filename: `${baseName}.${extension}`,
            content: testCase.generatedCode,
            framework: testCase.testFramework,
            category: testCase.category
          });
        }
      }

      const prResult = await githubService.createTestFilePR(
        repository.owner,
        repository.name,
        testFiles,
        testFiles[0]?.framework || 'Jest',
        repository.accessToken
      );

      res.json({
        pullRequest: prResult.pr,
        branch: prResult.branch,
        files: prResult.files,
        url: prResult.pr.html_url
      });
    } catch (error) {
      console.error('Error creating PR:', error);
      res.status(500).json({ message: 'Failed to create pull request: ' + error.message });
    }
  });

  // Test template routes
  app.get('/api/test-templates', async (req, res) => {
    try {
      const { framework, category } = req.query;
      const templates = await storage.getTestTemplates(framework, category);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching test templates:', error);
      res.status(500).json({ message: 'Failed to fetch test templates' });
    }
  });

  app.post('/api/test-templates', async (req, res) => {
    try {
      const template = await storage.createTestTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error('Error creating test template:', error);
      res.status(500).json({ message: 'Failed to create test template' });
    }
  });

  // Custom test generation
  app.post('/api/repositories/:id/custom-test', async (req, res) => {
    try {
      const { id } = req.params;
      const { customPrompt, testFramework, fileIds } = req.body;

      if (!customPrompt || !testFramework) {
        return res.status(400).json({ message: 'Custom prompt and test framework are required' });
      }

      const repository = await storage.getRepository(id);
      const allFiles = await storage.getRepositoryFiles(id);
      
      let targetFiles = allFiles;
      if (fileIds && fileIds.length > 0) {
        targetFiles = allFiles.filter(file => fileIds.includes(file.id));
      }

      // Ensure files have content
      for (const file of targetFiles) {
        if (!file.content) {
          const content = await githubService.getFileContent(
            repository.owner,
            repository.name,
            file.path,
            repository.accessToken
          );
          await storage.updateRepositoryFile(file.id, { content });
          file.content = content;
        }
      }

      const generatedCode = await geminiService.generateCustomTestCode(
        customPrompt,
        targetFiles,
        testFramework
      );

      res.json(generatedCode);
    } catch (error) {
      console.error('Error generating custom test:', error);
      res.status(500).json({ message: 'Failed to generate custom test: ' + error.message });
    }
  });

  // Test documentation generation
  app.post('/api/repositories/:id/generate-documentation', async (req, res) => {
    try {
      const { id } = req.params;
      const { testFramework } = req.body;

      const testCases = await storage.getTestCaseSummaries(id);
      if (testCases.length === 0) {
        return res.status(400).json({ message: 'No test cases found for documentation' });
      }

      const documentation = await geminiService.generateTestDocumentation(testCases, testFramework);

      res.json({ documentation });
    } catch (error) {
      console.error('Error generating documentation:', error);
      res.status(500).json({ message: 'Failed to generate documentation: ' + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

module.exports = { registerRoutes };