import { query } from "./_generated/server";
export const counts = query({
  args: {},
  handler: async (ctx) => {
    const usersCount = (await ctx.db.query("users").collect()).length;
    const profilesCount = (await ctx.db.query("profiles").collect()).length;
    const membershipsCount = (await ctx.db.query("memberships").collect()).length;
    return { usersCount, profilesCount, membershipsCount };
  }
});
