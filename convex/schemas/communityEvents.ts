import { defineTable } from "convex/server";
import { v } from "convex/values";
import { postStatusValidator } from "../lib/validators";

/**
 * Community Events table - Past events gallery & upcoming agenda
 * Separate from posts (editorial content) and events (audit log)
 */
export const communityEventsTable = defineTable({
  title: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  date: v.number(),
  location: v.string(),
  category: v.string(), // "celebration", "culture", "diplomacy", "sport", "charity"
  coverImageStorageId: v.optional(v.id("_storage")),
  galleryImageStorageIds: v.optional(v.array(v.id("_storage"))),
  status: postStatusValidator, // reuse draft/published/archived
  createdAt: v.number(),
  orgId: v.optional(v.id("orgs")),
})
  .index("by_slug", ["slug"])
  .index("by_date", ["status", "date"])
  .index("by_org", ["orgId"]);
