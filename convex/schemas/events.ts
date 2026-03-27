import { defineTable } from "convex/server";
import { v } from "convex/values";
import { eventTargetTypeValidator } from "../lib/validators";

/**
 * Events table - immutable audit log
 * Uses _creationTime instead of custom _createdAt
 */
export const eventsTable = defineTable({
  // Polymorphic target
  targetType: eventTargetTypeValidator,
  targetId: v.string(), // ID of target entity

  // Actor
  actorId: v.optional(v.id("users")), // null = system

  // Event details
  type: v.string(), // "status_changed", "document_uploaded", etc.
  data: v.optional(v.any()), // Payload specific to event type
})
  .index("by_target", ["targetType", "targetId"])
  .index("by_actor", ["actorId"]);
