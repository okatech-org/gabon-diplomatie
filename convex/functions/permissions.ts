import { v } from "convex/values";
import {
  authQuery,
  authMutation,
  superadminMutation,
} from "../lib/customFunctions";
import { permissionEffectValidator } from "../lib/validators";
import { getMembership } from "../lib/auth";
import { getTasksForMembership, isSuperAdmin, assertCanDoTask } from "../lib/permissions";
import { ALL_TASK_CODES, taskCodeValidator } from "../lib/taskCodes";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get the current user's resolved task codes for an org.
 * Returns an array of task code strings like ["requests.view", "requests.process", ...].
 * Used by the frontend `useCanDoTask` hook.
 */
export const getMyTasks = authQuery({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    // Superadmin gets all tasks
    if (isSuperAdmin(ctx.user)) {
      return [...ALL_TASK_CODES];
    }

    // Find user's membership in this org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", ctx.user._id).eq("orgId", args.orgId)
      )
      .first();

    if (!membership || membership.deletedAt) {
      return [];
    }

    const tasks = await getTasksForMembership(ctx, membership);
    return Array.from(tasks);
  },
});

/**
 * List special permissions for a member in an org (Org Admin)
 */
export const listByOrgMember = authQuery({
  args: {
    orgId: v.id("orgs"),
    membershipId: v.id("memberships"),
  },
  handler: async (ctx, args) => {
    const callerMembership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, callerMembership, "settings.manage");

    // Verify membership belongs to this org
    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.orgId !== args.orgId || membership.deletedAt) {
      return [];
    }

    return membership.specialPermissions ?? [];
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Set (create or update) a special permission for a member in an org (Org Admin)
 */
export const setForOrgMember = authMutation({
  args: {
    orgId: v.id("orgs"),
    membershipId: v.id("memberships"),
    taskCode: taskCodeValidator,
    effect: permissionEffectValidator,
  },
  handler: async (ctx, args) => {
    const callerMembership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, callerMembership, "settings.manage");

    // Verify membership belongs to this org
    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.orgId !== args.orgId || membership.deletedAt) {
      throw new Error("Membership not found in this organization");
    }

    const current = membership.specialPermissions ?? [];
    const updated = current.filter((p) => p.taskCode !== args.taskCode);
    updated.push({ taskCode: args.taskCode, effect: args.effect });

    await ctx.db.patch(args.membershipId, { specialPermissions: updated });
    return args.membershipId;
  },
});

/**
 * Set a special permission (SuperAdmin)
 */
export const set = superadminMutation({
  args: {
    membershipId: v.id("memberships"),
    taskCode: taskCodeValidator,
    effect: permissionEffectValidator,
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.deletedAt) {
      throw new Error("Membership not found");
    }

    const current = membership.specialPermissions ?? [];
    const updated = current.filter((p) => p.taskCode !== args.taskCode);
    updated.push({ taskCode: args.taskCode, effect: args.effect });

    await ctx.db.patch(args.membershipId, { specialPermissions: updated });
    return args.membershipId;
  },
});

/**
 * Remove a specific permission override for an org member (Org Admin)
 */
export const removeForOrgMember = authMutation({
  args: {
    orgId: v.id("orgs"),
    membershipId: v.id("memberships"),
    taskCode: taskCodeValidator,
  },
  handler: async (ctx, args) => {
    const callerMembership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, callerMembership, "settings.manage");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.orgId !== args.orgId || membership.deletedAt) {
      throw new Error("Membership not found in this organization");
    }

    const current = membership.specialPermissions ?? [];
    const updated = current.filter((p) => p.taskCode !== args.taskCode);

    await ctx.db.patch(args.membershipId, { specialPermissions: updated });
    return args.membershipId;
  },
});

/**
 * Reset all special permissions for a member (Org Admin)
 */
export const resetAllForOrgMember = authMutation({
  args: {
    orgId: v.id("orgs"),
    membershipId: v.id("memberships"),
  },
  handler: async (ctx, args) => {
    const callerMembership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, callerMembership, "settings.manage");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.orgId !== args.orgId || membership.deletedAt) {
      throw new Error("Membership not found in this organization");
    }

    await ctx.db.patch(args.membershipId, { specialPermissions: [] });
    return args.membershipId;
  },
});

/**
 * Reset all special permissions for a membership (SuperAdmin)
 */
export const resetAll = superadminMutation({
  args: { membershipId: v.id("memberships") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.deletedAt) {
      throw new Error("Membership not found");
    }

    await ctx.db.patch(args.membershipId, { specialPermissions: [] });
    return args.membershipId;
  },
});
