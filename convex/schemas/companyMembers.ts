import { defineTable } from "convex/server";
import { v } from "convex/values";
import { companyRoleValidator } from "../lib/validators";

/**
 * Company Members table — user ↔ company relationship
 * Uses CompanyRole (CEO, Owner, President, Director, Manager).
 */
export const companyMembersTable = defineTable({
  userId: v.id("users"),
  companyId: v.id("companies"),

  role: companyRoleValidator,
  title: v.optional(v.string()), // Custom job title

  deletedAt: v.optional(v.number()),
})
  .index("by_user_company", ["userId", "companyId"])
  .index("by_company", ["companyId"])
  .index("by_user", ["userId"]);
