import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const checkId = query({
  args: {
    id: v.string()
  },
  handler: async (ctx, args) => {
    // Just blindly cast and get
    const doc = await ctx.db.get(args.id as any);
    return doc;
  }
});
