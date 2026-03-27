import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  associationRoleValidator,
  associationMemberStatusValidator,
} from "../lib/validators";

/**
 * Association Members table — user ↔ association relationship
 * Uses AssociationRole (President, VP, Secretary, Treasurer, Member)
 * and AssociationMemberStatus (Pending, Accepted, Declined).
 */
export const associationMembersTable = defineTable({
  userId: v.id("users"),
  associationId: v.id("associations"),

  role: associationRoleValidator,
  status: associationMemberStatusValidator,

  joinedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})
  .index("by_user_assoc", ["userId", "associationId"])
  .index("by_assoc", ["associationId"])
  .index("by_user", ["userId"])
  .index("by_status", ["associationId", "status"]);
