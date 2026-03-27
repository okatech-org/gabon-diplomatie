import { defineTable } from "convex/server";
import { v } from "convex/values";
import { taskCodeValidator } from "../lib/taskCodes";
import { permissionEffectValidator } from "../lib/validators";

/**
 * Memberships table - User ↔ Org relationship
 *
 * Permissions are derived from:
 *   positionId → position.tasks (stored directly in DB)
 *
 * Per-member overrides are stored inline in `specialPermissions`.
 */
export const membershipsTable = defineTable({
  userId: v.id("users"),
  orgId: v.id("orgs"),

  // Position-based role — links to position → tasks (stored in DB)
  positionId: v.optional(v.id("positions")),

  // Per-member permission overrides (grant/deny specific task codes)
  specialPermissions: v.optional(v.array(v.object({
    taskCode: taskCodeValidator,
    effect: permissionEffectValidator, // "grant" | "deny"
  }))),

  // Per-membership agent preferences (different per org)
  settings: v.optional(v.object({
    notifyOnNewRequest: v.optional(v.boolean()),    // Notify when new request arrives
    notifyOnAssignment: v.optional(v.boolean()),    // Notify when assigned a request
    dailyDigest: v.optional(v.boolean()),           // Daily summary email
  })),

  // Contact
  isPublicContact: v.optional(v.boolean()), // Visible in public contact directory

  deletedAt: v.optional(v.number()), // Soft delete
})
  // Note: by_user_org can be used for "by_user" queries via prefix matching
  .index("by_user_org", ["userId", "orgId"])
  .index("by_org", ["orgId"])
  .index("by_user_org_deletedAt", ["userId", "orgId", "deletedAt"])
  .index("by_org_deletedAt", ["orgId", "deletedAt"]);
