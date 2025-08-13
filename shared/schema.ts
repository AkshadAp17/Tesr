import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const repositories = pgTable("repositories", {
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

export const repositoryFiles = pgTable("repository_files", {
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

export const testCaseSummaries = pgTable("test_case_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  testFramework: text("test_framework").notNull(),
  files: jsonb("files").$type<string[]>().notNull(),
  testCaseCount: text("test_case_count").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  generatedCode: text("generated_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  createdAt: true,
});

export const insertRepositoryFileSchema = createInsertSchema(repositoryFiles).omit({
  id: true,
});

export const insertTestCaseSummarySchema = createInsertSchema(testCaseSummaries).omit({
  id: true,
  createdAt: true,
});

export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type RepositoryFile = typeof repositoryFiles.$inferSelect;
export type InsertRepositoryFile = z.infer<typeof insertRepositoryFileSchema>;
export type TestCaseSummary = typeof testCaseSummaries.$inferSelect;
export type InsertTestCaseSummary = z.infer<typeof insertTestCaseSummarySchema>;
