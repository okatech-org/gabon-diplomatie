import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Call Lines — Multi-line call routing for organizations
 *
 * Two types:
 *   - "org": shared line (N agents), e.g. "Urgences", "Accueil"
 *   - "personal": direct line for a single agent (auto-created on membership)
 *
 * When a citizen calls an org, they can select a specific line.
 * Only agents assigned to that line will receive the call.
 */
export const callLinesTable = defineTable({
  // Type
  type: v.union(v.literal("org"), v.literal("personal")),
  orgId: v.id("orgs"),

  // Display
  label: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  color: v.optional(v.string()),
  priority: v.number(),
  isDefault: v.optional(v.boolean()),

  // Status
  isActive: v.boolean(),

  // Agents assigned to this line
  membershipIds: v.array(v.id("memberships")),

  // For personal lines: direct link to the user
  userId: v.optional(v.id("users")),
})
  .index("by_org", ["orgId"])
  .index("by_org_active", ["orgId", "isActive"])
  .index("by_user", ["userId"]);
