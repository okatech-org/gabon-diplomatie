import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Generic atomic counters table.
 * Each document holds a named counter with an integer value.
 * Used for sequential number generation (e.g. consular card numbers).
 */
export const countersTable = defineTable({
	name: v.string(),
	value: v.number(),
}).index("by_name", ["name"]);
