import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { githubService } from "./services/github";
import { geminiService } from "./services/gemini";
import { insertRepositorySchema, insertRepositoryFileSchema, insertTestCaseSummarySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Repository routes
  app.get("/api/repositories", async (req, res) => {
    try {
      const repositories = await storage.getRepositories();
      res.json(repositories);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  app.post("/api/repositories", async (req, res) => {
    try {
      const repositoryData = insertRepositorySchema.parse(req.body);
      const repository = await storage.createRepository(repositoryData);
      res.json(repository);
    } catch (error) {
      console.error("Error creating repository:", error);
      res.status(400).json({ message: "Failed to create repository" });
    }
  });

  app.get("/api/repositories/:id", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      res.json(repository);
    } catch (error) {
      console.error("Error fetching repository:", error);
      res.status(500).json({ message: "Failed to fetch repository" });
    }
  });

  // GitHub integration routes
  app.get("/api/github/repositories", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      if (!accessToken) {
        return res.status(401).json({ message: "Access token required" });
      }

      const repos = await githubService.getUserRepositories(accessToken);
      res.json(repos);
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      res.status(500).json({ message: "Failed to fetch GitHub repositories" });
    }
  });

  app.get("/api/github/repositories/:owner/:repo/contents", async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const { path = '' } = req.query;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        return res.status(401).json({ message: "Access token required" });
      }

      const contents = await githubService.getRepositoryContents(
        owner, 
        repo, 
        path as string, 
        accessToken
      );
      
      res.json(contents);
    } catch (error) {
      console.error("Error fetching repository contents:", error);
      res.status(500).json({ message: "Failed to fetch repository contents" });
    }
  });

  app.get("/api/github/repositories/:owner/:repo/file", async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const { path } = req.query;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken || !path) {
        return res.status(400).json({ message: "Access token and path required" });
      }

      const content = await githubService.getFileContent(
        owner, 
        repo, 
        path as string, 
        accessToken
      );
      
      res.json({ content });
    } catch (error) {
      console.error("Error fetching file content:", error);
      res.status(500).json({ message: "Failed to fetch file content" });
    }
  });

  // Repository files routes
  app.get("/api/repositories/:id/files", async (req, res) => {
    try {
      const files = await storage.getRepositoryFiles(req.params.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching repository files:", error);
      res.status(500).json({ message: "Failed to fetch repository files" });
    }
  });

  app.post("/api/repositories/:id/files", async (req, res) => {
    try {
      const fileData = insertRepositoryFileSchema.parse({
        ...req.body,
        repositoryId: req.params.id,
      });
      const file = await storage.createRepositoryFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error creating repository file:", error);
      res.status(400).json({ message: "Failed to create repository file" });
    }
  });

  app.patch("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.updateRepositoryFile(req.params.id, req.body);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Test case routes
  app.get("/api/repositories/:id/test-cases", async (req, res) => {
    try {
      const testCases = await storage.getTestCaseSummaries(req.params.id);
      res.json(testCases);
    } catch (error) {
      console.error("Error fetching test cases:", error);
      res.status(500).json({ message: "Failed to fetch test cases" });
    }
  });

  app.post("/api/repositories/:id/generate-test-summaries", async (req, res) => {
    try {
      const { testFramework } = req.body;
      const repositoryId = req.params.id;
      
      // Get selected files
      const selectedFiles = await storage.getSelectedFiles(repositoryId);
      if (selectedFiles.length === 0) {
        return res.status(400).json({ message: "No files selected" });
      }

      // Prepare files for AI analysis
      const filesForAI = selectedFiles
        .filter(file => file.content)
        .map(file => ({
          path: file.path,
          content: file.content!,
          language: file.language || 'text'
        }));

      if (filesForAI.length === 0) {
        return res.status(400).json({ message: "Selected files have no content" });
      }

      // Generate test case summaries using Gemini
      const summaries = await geminiService.generateTestCaseSummaries(
        filesForAI,
        testFramework || 'Jest'
      );

      // Store summaries in storage
      const storedSummaries = await Promise.all(
        summaries.map(summary => 
          storage.createTestCaseSummary({
            repositoryId,
            testFramework: testFramework || 'Jest',
            ...summary
          })
        )
      );

      res.json(storedSummaries);
    } catch (error) {
      console.error("Error generating test summaries:", error);
      res.status(500).json({ message: "Failed to generate test summaries" });
    }
  });

  app.post("/api/test-cases/:id/generate-code", async (req, res) => {
    try {
      const testCaseSummary = await storage.getTestCaseSummary(req.params.id);
      if (!testCaseSummary) {
        return res.status(404).json({ message: "Test case summary not found" });
      }

      // Get files referenced in the test case
      const repositoryFiles = await storage.getRepositoryFiles(testCaseSummary.repositoryId);
      const referencedFiles = repositoryFiles
        .filter(file => testCaseSummary.files.includes(file.path) && file.content)
        .map(file => ({
          path: file.path,
          content: file.content!,
          language: file.language || 'text'
        }));

      if (referencedFiles.length === 0) {
        return res.status(400).json({ message: "Referenced files have no content" });
      }

      // Generate test code using Gemini
      const generatedCode = await geminiService.generateTestCode(
        {
          title: testCaseSummary.title,
          description: testCaseSummary.description,
          priority: testCaseSummary.priority as 'high' | 'medium' | 'low',
          testCaseCount: testCaseSummary.testCaseCount,
          estimatedTime: testCaseSummary.estimatedTime,
          files: testCaseSummary.files,
          category: 'generated' // Default category
        },
        referencedFiles,
        testCaseSummary.testFramework
      );

      // Update test case summary with generated code
      const updatedSummary = await storage.updateTestCaseSummary(req.params.id, {
        generatedCode: generatedCode.content
      });

      res.json({
        ...generatedCode,
        summary: updatedSummary
      });
    } catch (error) {
      console.error("Error generating test code:", error);
      res.status(500).json({ message: "Failed to generate test code" });
    }
  });

  // GitHub PR creation
  app.post("/api/github/repositories/:owner/:repo/pull-requests", async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const { title, body, head, base } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        return res.status(401).json({ message: "Access token required" });
      }

      const pr = await githubService.createPullRequest(
        owner,
        repo,
        title,
        body,
        head,
        base,
        accessToken
      );

      res.json(pr);
    } catch (error) {
      console.error("Error creating pull request:", error);
      res.status(500).json({ message: "Failed to create pull request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
