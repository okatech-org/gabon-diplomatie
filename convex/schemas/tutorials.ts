import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  tutorialCategoryValidator,
  tutorialTypeValidator,
  postStatusValidator,
} from "../lib/validators";

/**
 * Tutorials table - Académie Numérique content
 * Guides, videos, and articles for citizens
 */
export const tutorialsTable = defineTable({
  title: v.string(),
  slug: v.string(),
  excerpt: v.string(),
  content: v.string(), // HTML from Tiptap
  coverImageStorageId: v.optional(v.id("_storage")),

  category: tutorialCategoryValidator,
  type: tutorialTypeValidator,
  duration: v.optional(v.string()), // "5 min", "10 min read"
  videoUrl: v.optional(v.string()),

  status: postStatusValidator, // reuse draft/published/archived
  publishedAt: v.optional(v.number()),
  createdAt: v.number(),
  authorId: v.id("users"),
})
  .index("by_slug", ["slug"])
  .index("by_category", ["category"])
  .index("by_status", ["status"])
  .index("by_published", ["status", "publishedAt"])
  .index("by_category_status", ["category", "status"]);
