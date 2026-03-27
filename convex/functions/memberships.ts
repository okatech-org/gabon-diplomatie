import { v } from "convex/values";
import { authQuery } from "../lib/customFunctions";
import { RegistrationStatus } from "../lib/constants";

/**
 * List organizations the current user is a member of
 */
export const listMyMemberships = authQuery({
  args: {},
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user_org_deletedAt", (q) => q.eq("userId", ctx.user._id))
      .collect();
    // Filter out soft-deleted after prefix match on userId
    const activeMemberships = memberships.filter((m) => m.deletedAt === undefined);

    // Batch fetch orgs
    const orgIds = activeMemberships.map((m) => m.orgId);
    const orgs = await Promise.all(orgIds.map((id) => ctx.db.get(id)));
    const orgMap = new Map(orgs.filter(Boolean).map((o) => [o!._id, o!]));

    return activeMemberships
      .map((m) => {
        const org = orgMap.get(m.orgId);
        if (!org || !org.isActive || org.deletedAt) return null;
        return {
          ...m,
          org,
        };
      })
      .filter(Boolean);
  },
});

/**
 * Get membership details for a specific org
 */
export const getMyMembership = authQuery({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org_deletedAt", (q) =>
        q.eq("userId", ctx.user._id).eq("orgId", args.orgId).eq("deletedAt", undefined)
      )
      .unique();

    return membership;
  },
});

/**
 * List organizations with ready-to-print counts for EasyCard app
 * For agents: returns their org memberships with print counts
 * For superadmins: returns all orgs with print counts
 */
export const listMyOrgsWithPrintCounts = authQuery({
  args: {},
  handler: async (ctx) => {
    const isSuperadmin = ctx.user.isSuperadmin ?? false;

    let orgs: Array<{
      _id: any;
      name: string;
      slug: string;
      logoUrl?: string;
      country?: string;
    }> = [];

    if (isSuperadmin) {
      // SuperAdmin: get all active orgs
      const allOrgs = await ctx.db
        .query("orgs")
        .withIndex("by_active_notDeleted", (q) =>
          q.eq("isActive", true).eq("deletedAt", undefined)
        )
        .collect();
      orgs = allOrgs.map((o) => ({
        _id: o._id,
        name: o.name,
        slug: o.slug,
        logoUrl: o.logoUrl,
        country: o.country,
      }));
    } else {
      // Agent: get orgs from memberships
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_user_org_deletedAt", (q) => q.eq("userId", ctx.user._id))
        .collect();
      // Filter prefix match: only non-deleted
      const activeMemberships = memberships.filter((m) => m.deletedAt === undefined);

      const orgDocs = await Promise.all(
        activeMemberships.map((m) => ctx.db.get(m.orgId)),
      );
      orgs = orgDocs
        .filter(
          (o): o is NonNullable<typeof o> =>
            o !== null && o.isActive && !o.deletedAt,
        )
        .map((o) => ({
          _id: o._id,
          name: o.name,
          slug: o.slug,
          logoUrl: o.logoUrl,
          country: o.country,
        }));
    }

    // For each org, count profiles ready for print
    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        // Get active registrations with cardNumber but no printedAt
        const registrations = await ctx.db
          .query("consularRegistrations")
          .withIndex("by_org_status", (q) =>
            q.eq("orgId", org._id).eq("status", RegistrationStatus.Active),
          )
          .collect();

        const readyToPrintCount = registrations.filter(
          (r) => r.cardNumber && !r.printedAt,
        ).length;

        return {
          ...org,
          readyToPrintCount,
        };
      }),
    );

    return orgsWithCounts;
  },
});
