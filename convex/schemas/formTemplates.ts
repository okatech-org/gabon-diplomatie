import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Form Templates - Reusable form structures
 * Templates can be organization-specific or global (for superadmins)
 */
export const formTemplatesTable = defineTable({
	// Basic info
	name: v.object({
		fr: v.string(),
		en: v.optional(v.string()),
	}),
	description: v.optional(
		v.object({
			fr: v.string(),
			en: v.optional(v.string()),
		})
	),

	// Template category for easier discovery
	category: v.optional(
		v.union(
			v.literal("identity"),
			v.literal("visa"),
			v.literal("civil_status"),
			v.literal("certification"),
			v.literal("registration"),
			v.literal("custom")
		)
	),

	// The form schema (JSON Schema format)
	schema: v.any(), // FormSchema type

	// Ownership
	orgId: v.optional(v.id("orgs")), // null = global template
	createdBy: v.optional(v.id("users")),

	// Visibility
	isGlobal: v.boolean(), // Available to all orgs
	isActive: v.boolean(),

	// Metadata
	usageCount: v.optional(v.number()), // How many times this template has been used
	updatedAt: v.optional(v.number()),
})
	.index("by_org", ["orgId", "isActive"])
	.index("by_category", ["category", "isActive"])
	.index("by_global", ["isGlobal", "isActive"]);
