import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  ticketStatusValidator,
  ticketPriorityValidator,
  ticketCategoryValidator,
} from "../lib/validators";

/**
 * Message within a ticket
 */
export const ticketMessageValidator = v.object({
  id: v.string(), // nanoid
  senderId: v.id("users"),
  isStaff: v.boolean(),
  content: v.string(),
  createdAt: v.number(),
  attachments: v.optional(v.array(v.id("documents"))),
});

/**
 * Tickets table - Support and feedback from users
 */
export const ticketsTable = defineTable({
  reference: v.string(), // e.g. TCK-2024-ABC123
  userId: v.id("users"),
  profileId: v.optional(v.id("profiles")),
  
  subject: v.string(),
  description: v.string(), // Initial message or detailed description
  
  status: ticketStatusValidator,
  priority: ticketPriorityValidator,
  category: ticketCategoryValidator,
  
  // Attachments for the initial ticket issue
  attachments: v.optional(v.array(v.id("documents"))),
  
  // Conversation thread
  messages: v.optional(v.array(ticketMessageValidator)),
  
  assignedTo: v.optional(v.id("users")), // Assigned staff member
  
  resolvedAt: v.optional(v.number()),
  closedAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  .index("by_reference", ["reference"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_category", ["category"])
  .index("by_assigned", ["assignedTo"]);
