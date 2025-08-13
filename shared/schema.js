const { sql } = require("drizzle-orm");
const { pgTable, text, varchar, jsonb, timestamp, boolean } = require("drizzle-orm/pg-core");
const { createInsertSchema } = require("drizzle-zod");
const { z } = require("zod");

const repositories = pgTable("repositories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  owner: text("owner").notNull(),
  description: text("description"),
  language: text("language"),
  isPrivate: boolean("is_private").default(false),
  accessToken: text("access_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

const repositoryFiles = pgTable("repository_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  path: text("path").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'file' | 'directory'
  size: text("size"),
  content: text("content"),
  language: text("language"),
  isSelected: boolean("is_selected").default(false),
});

const testCaseSummaries = pgTable("test_case_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  testFramework: text("test_framework").notNull(),
  files: jsonb("files").$type().notNull(),
  testCaseCount: text("test_case_count").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  generatedCode: text("generated_code"),
  isCustomizable: boolean("is_customizable").default(true),
  category: text("category").default("unit"), // 'unit' | 'integration' | 'e2e' | 'performance'
  createdAt: timestamp("created_at").defaultNow(),
});

// Test case templates for different frameworks
const testTemplates = pgTable("test_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  framework: text("framework").notNull(), // 'Jest' | 'Pytest' | 'JUnit' | 'Selenium' | 'Cypress' | 'Playwright'
  category: text("category").notNull(), // 'unit' | 'integration' | 'e2e' | 'performance'
  template: text("template").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  createdAt: true,
});

const insertRepositoryFileSchema = createInsertSchema(repositoryFiles).omit({
  id: true,
});

const insertTestCaseSummarySchema = createInsertSchema(testCaseSummaries).omit({
  id: true,
  createdAt: true,
});

const insertTestTemplateSchema = createInsertSchema(testTemplates).omit({
  id: true,
  createdAt: true,
});

module.exports = {
  repositories,
  repositoryFiles,
  testCaseSummaries,
  testTemplates,
  insertRepositorySchema,
  insertRepositoryFileSchema,
  insertTestCaseSummarySchema,
  insertTestTemplateSchema,
};