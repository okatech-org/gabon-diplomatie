import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Messages table for in-request messaging between agents and citizens
 */
export const messagesTable = defineTable({
  // Request this message belongs to
  requestId: v.id("requests"),
  
  // Sender information
  senderId: v.id("users"),
  senderRole: v.union(v.literal("citizen"), v.literal("agent")),
  
  // Message content
  content: v.string(),
  attachments: v.optional(v.array(v.id("documents"))),
  
  // Read status
  readAt: v.optional(v.number()),
  
  // Timestamps
  createdAt: v.number(),
})
  .index("by_request", ["requestId"])
  .index("by_request_created", ["requestId", "createdAt"])
  .index("by_sender", ["senderId"]);
