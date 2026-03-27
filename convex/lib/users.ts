import { MutationCtx } from "../_generated/server";

/**
 * Helper to create a placeholder user for an invite.
 * Can be used by multiple mutations to avoid circular dependencies.
 */
export async function createInvitedUserHelper(
  ctx: MutationCtx,
  email: string,
  name: string,
  firstName?: string,
  lastName?: string
) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();

  if (existing) return existing._id;

  // Create placeholder
  return await ctx.db.insert("users", {
    authId: `invite_${email}`,
    email,
    name,
    firstName,
    lastName,
    isActive: true,
    isSuperadmin: false,
    updatedAt: Date.now(),
  });
}
