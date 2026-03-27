import { query } from "./_generated/server";
import { components } from "./_generated/api";

export const dumpUserRecords = query({
  args: {},
  handler: async (ctx) => {
    // 1. Find all users with this email
    const users = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      where: [{ field: "email", value: "itoutouberny@gmail.com" }],
      paginationOpts: { numItems: 10, cursor: null }
    }) as any;
    
    // 2. For each user, find their accounts
    const results = [];
    for (const u of users.page) {
      const accounts = await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: "account",
        where: [{ field: "userId", value: u._id }],
        paginationOpts: { numItems: 10, cursor: null }
      }) as any;
      
      results.push({
        user: u,
        accounts: accounts.page
      });
    }
    
    console.log("Dump results:", JSON.stringify(results, null, 2));
    return results;
  },
});
