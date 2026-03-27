import { defineTable } from "convex/server";
import { v } from "convex/values";
import { associationClaimStatusValidator } from "../lib/validators";

/**
 * Association Claims table — ownership claims for seeded/unmanaged associations.
 * Users submit a claim → super admin reviews → approve (user becomes President) or reject.
 */
export const associationClaimsTable = defineTable({
  userId: v.id("users"),
  associationId: v.id("associations"),
  status: associationClaimStatusValidator,
  message: v.optional(v.string()),
  reviewedBy: v.optional(v.id("users")),
  reviewNote: v.optional(v.string()),
  createdAt: v.number(),
  reviewedAt: v.optional(v.number()),
})
  .index("by_association", ["associationId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"]);
