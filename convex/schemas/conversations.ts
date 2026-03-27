import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * AI Conversations table
 * Stores chat history with the AI assistant
 */
export const conversationsTable = defineTable({
  userId: v.id("users"),
  title: v.optional(v.string()),
  messages: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("tool")),
      content: v.string(),
      toolCalls: v.optional(
        v.array(
          v.object({
            name: v.string(),
            args: v.any(),
            result: v.optional(v.any()),
          })
        )
      ),
      timestamp: v.number(),
    })
  ),
  status: v.union(v.literal("active"), v.literal("archived")),
  metadata: v.optional(
    v.object({
      currentPage: v.optional(v.string()),
    })
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"]);
