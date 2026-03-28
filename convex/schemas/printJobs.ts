import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Print Jobs — Tracks card printing jobs in the print queue.
 * Each job references a card design and optionally a profile for dynamic field substitution.
 * Jobs progress through: queued → printing → completed (or failed/cancelled).
 */

export const printJobsTable = defineTable({
	// What to print
	designId: v.id("cardDesigns"),
	designName: v.string(), // denormalized for display
	designVersion: v.number(), // snapshot the version at creation time

	// Who to print for (optional — blank card if not set)
	profileId: v.optional(v.id("profiles")),
	profileName: v.optional(v.string()), // denormalized "Nom Prénom"

	// Resolved dynamic field values snapshot (so print is reproducible)
	fieldValues: v.optional(v.any()), // Record<string, string>

	// Print settings
	copies: v.number(),
	printDuplex: v.boolean(),
	priority: v.union(v.literal("normal"), v.literal("high"), v.literal("urgent")),

	// Status tracking
	status: v.union(
		v.literal("queued"),
		v.literal("printing"),
		v.literal("completed"),
		v.literal("failed"),
		v.literal("cancelled"),
	),
	errorMessage: v.optional(v.string()),

	// Batch grouping — jobs created together share a batchId
	batchId: v.optional(v.string()),

	// Ownership
	orgId: v.id("orgs"),
	createdBy: v.id("users"),

	// Timestamps
	queuedAt: v.number(),
	startedAt: v.optional(v.number()),
	completedAt: v.optional(v.number()),
})
	.index("by_org_status", ["orgId", "status", "queuedAt"])
	.index("by_org_queued", ["orgId", "queuedAt"])
	.index("by_batch", ["batchId"]);
