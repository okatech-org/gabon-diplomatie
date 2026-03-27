import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

/**
 * Internal query: Read cached GCP metrics data.
 */
export const getCachedData = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("gcpMetricsCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
  },
});

/**
 * Internal mutation: Update or insert cached GCP metrics data.
 */
export const updateCache = internalMutation({
  args: {
    key: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { key, data }) => {
    const existing = await ctx.db
      .query("gcpMetricsCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { data, fetchedAt: now });
    } else {
      await ctx.db.insert("gcpMetricsCache", { key, data, fetchedAt: now });
    }
  },
});
