import { defineTable } from "convex/server";
import { v } from "convex/values";
import { localizedStringValidator } from "../lib/validators";
import { taskCodeValidator } from "../lib/taskCodes";

/**
 * Positions — Job titles within an organization
 */
export const positionsTable = defineTable({
  orgId: v.id("orgs"), // Which organization this position belongs to
  code: v.string(), // Unique within org (e.g. "vice_consul")
  title: localizedStringValidator, // LocalizedString: { fr: "...", en: "..." }
  description: v.optional(localizedStringValidator),
  level: v.number(), // Hierarchy level (1 = highest)
  grade: v.optional(v.string()), // PositionGrade: "chief" | "counselor" | "agent" | "external"
  ministryGroupId: v.optional(v.id("ministryGroups")),
  tasks: v.array(taskCodeValidator), // Resolved task codes stored in DB (e.g. ["requests.view", "documents.validate"])
  isRequired: v.boolean(), // Must always exist in this org
  isUnique: v.optional(v.boolean()), // Only one person can hold this position
  isActive: v.boolean(),
  createdBy: v.optional(v.id("users")),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})
  .index("by_org", ["orgId", "isActive"])
  .index("by_org_code", ["orgId", "code"])
  .index("by_org_level", ["orgId", "level"]);

/**
 * Ministry Groups — Organizational sub-groups within a diplomatic post
 */
export const ministryGroupsTable = defineTable({
  orgId: v.id("orgs"), // Which org this group belongs to
  code: v.string(), // e.g. "mae", "finances", "defense"
  label: localizedStringValidator, // LocalizedString: { fr: "...", en: "..." }
  description: v.optional(localizedStringValidator),
  icon: v.optional(v.string()), // Lucide icon name
  sortOrder: v.number(), // Display order
  parentCode: v.optional(v.string()), // For sub-directions
  isActive: v.boolean(),
  createdBy: v.optional(v.id("users")),
  deletedAt: v.optional(v.number()),
})
  .index("by_org", ["orgId", "isActive"])
  .index("by_org_code", ["orgId", "code"]);

