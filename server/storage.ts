import {
  repositories,
  repositoryFiles,
  testCaseSummaries,
  type Repository,
  type InsertRepository,
  type RepositoryFile,
  type InsertRepositoryFile,
  type TestCaseSummary,
  type InsertTestCaseSummary,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Repository operations
  getRepository(id: string): Promise<Repository | undefined>;
  getRepositories(): Promise<Repository[]>;
  createRepository(repo: InsertRepository): Promise<Repository>;
  updateRepository(id: string, repo: Partial<InsertRepository>): Promise<Repository | undefined>;

  // File operations
  getRepositoryFiles(repositoryId: string): Promise<RepositoryFile[]>;
  createRepositoryFile(file: InsertRepositoryFile): Promise<RepositoryFile>;
  updateRepositoryFile(id: string, file: Partial<InsertRepositoryFile>): Promise<RepositoryFile | undefined>;
  getSelectedFiles(repositoryId: string): Promise<RepositoryFile[]>;
  
  // Test case operations
  getTestCaseSummaries(repositoryId: string): Promise<TestCaseSummary[]>;
  createTestCaseSummary(summary: InsertTestCaseSummary): Promise<TestCaseSummary>;
  updateTestCaseSummary(id: string, summary: Partial<InsertTestCaseSummary>): Promise<TestCaseSummary | undefined>;
  getTestCaseSummary(id: string): Promise<TestCaseSummary | undefined>;
}

export class MemStorage implements IStorage {
  private repositories: Map<string, Repository>;
  private repositoryFiles: Map<string, RepositoryFile>;
  private testCaseSummaries: Map<string, TestCaseSummary>;

  constructor() {
    this.repositories = new Map();
    this.repositoryFiles = new Map();
    this.testCaseSummaries = new Map();
  }

  async getRepository(id: string): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values());
  }

  async createRepository(repo: InsertRepository): Promise<Repository> {
    const id = randomUUID();
    const repository: Repository = {
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

  async updateRepository(id: string, repo: Partial<InsertRepository>): Promise<Repository | undefined> {
    const existing = this.repositories.get(id);
    if (!existing) return undefined;
    
    const updated: Repository = { ...existing, ...repo };
    this.repositories.set(id, updated);
    return updated;
  }

  async getRepositoryFiles(repositoryId: string): Promise<RepositoryFile[]> {
    return Array.from(this.repositoryFiles.values()).filter(
      file => file.repositoryId === repositoryId
    );
  }

  async createRepositoryFile(file: InsertRepositoryFile): Promise<RepositoryFile> {
    const id = randomUUID();
    const repositoryFile: RepositoryFile = { 
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

  async updateRepositoryFile(id: string, file: Partial<InsertRepositoryFile>): Promise<RepositoryFile | undefined> {
    const existing = this.repositoryFiles.get(id);
    if (!existing) return undefined;
    
    const updated: RepositoryFile = { ...existing, ...file };
    this.repositoryFiles.set(id, updated);
    return updated;
  }

  async getSelectedFiles(repositoryId: string): Promise<RepositoryFile[]> {
    return Array.from(this.repositoryFiles.values()).filter(
      file => file.repositoryId === repositoryId && file.isSelected
    );
  }

  async getTestCaseSummaries(repositoryId: string): Promise<TestCaseSummary[]> {
    return Array.from(this.testCaseSummaries.values()).filter(
      summary => summary.repositoryId === repositoryId
    );
  }

  async createTestCaseSummary(summary: InsertTestCaseSummary): Promise<TestCaseSummary> {
    const id = randomUUID();
    const testCaseSummary: TestCaseSummary = {
      id,
      repositoryId: summary.repositoryId,
      title: summary.title,
      description: summary.description,
      priority: summary.priority,
      testFramework: summary.testFramework,
      files: Array.isArray(summary.files) ? summary.files as string[] : [],
      testCaseCount: summary.testCaseCount,
      estimatedTime: summary.estimatedTime,
      generatedCode: summary.generatedCode || null,
      createdAt: new Date(),
    };
    this.testCaseSummaries.set(id, testCaseSummary);
    return testCaseSummary;
  }

  async updateTestCaseSummary(id: string, summary: Partial<InsertTestCaseSummary>): Promise<TestCaseSummary | undefined> {
    const existing = this.testCaseSummaries.get(id);
    if (!existing) return undefined;
    
    const updated: TestCaseSummary = { 
      ...existing, 
      ...summary,
      files: summary.files ? (Array.isArray(summary.files) ? summary.files as string[] : []) : existing.files
    };
    this.testCaseSummaries.set(id, updated);
    return updated;
  }

  async getTestCaseSummary(id: string): Promise<TestCaseSummary | undefined> {
    return this.testCaseSummaries.get(id);
  }
}

export const storage = new MemStorage();
