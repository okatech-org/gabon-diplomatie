import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Agent notes table - internal notes for agents
 * Notes can be created by agents or AI analysis
 */
export const agentNotesTable = defineTable({
  requestId: v.id("requests"),
  authorId: v.optional(v.id("users")), // Optional for AI-generated notes
  content: v.string(),
  source: v.union(v.literal("agent"), v.literal("ai")),
  
  // AI analysis metadata
  aiAnalysisType: v.optional(v.union(
    v.literal("completeness"),
    v.literal("document_check"),
    v.literal("data_validation")
  )),
  aiConfidence: v.optional(v.number()), // 0-100
  
  createdAt: v.number(),
})
  .index("by_request", ["requestId"])
  .index("by_request_source", ["requestId", "source"]);
