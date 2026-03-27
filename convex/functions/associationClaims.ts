/**
 * Association Claims Functions
 *
 * Handles ownership claims for seeded/unmanaged associations.
 * - Users submit claims with an optional message.
 * - Super admins review and approve/reject claims.
 * - On approval, the claimant becomes President of the association.
 */

import { v } from "convex/values";
import { authQuery, authMutation } from "../lib/customFunctions";
import { error, ErrorCode } from "../lib/errors";
import { isSuperadminUser } from "../lib/auth";
import {
  AssociationRole,
  AssociationMemberStatus,
  AssociationClaimStatus,
} from "../lib/constants";

// ═══════════════════════════════════════════════════════════════════════════
// USER-FACING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit an ownership claim for an association
 */
export const claimAssociation = authMutation({
  args: {
    associationId: v.id("associations"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const association = await ctx.db.get(args.associationId);
    if (!association || association.deletedAt || !association.isActive) {
      throw error(ErrorCode.NOT_FOUND, "Association not found");
    }

    // Check if association already has a President
    const members = await ctx.db
      .query("associationMembers")
      .withIndex("by_assoc", (q) => q.eq("associationId", args.associationId))
      .collect();

    const hasPresident = members.some(
      (m) =>
        !m.deletedAt &&
        m.status === AssociationMemberStatus.Accepted &&
        m.role === AssociationRole.President,
    );

    if (hasPresident) {
      throw error(
        ErrorCode.INVALID_ARGUMENT,
        "This association already has a president",
      );
    }

    // Check for existing pending claim by this user
    const existingClaim = await ctx.db
      .query("associationClaims")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const hasPendingClaim = existingClaim.some(
      (c) =>
        c.associationId === args.associationId &&
        c.status === AssociationClaimStatus.Pending,
    );

    if (hasPendingClaim) {
      throw error(
        ErrorCode.INVALID_ARGUMENT,
        "You already have a pending claim for this association",
      );
    }

    return await ctx.db.insert("associationClaims", {
      userId: ctx.user._id,
      associationId: args.associationId,
      status: AssociationClaimStatus.Pending,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get my claims
 */
export const getMyClaims = authQuery({
  args: {},
  handler: async (ctx) => {
    const claims = await ctx.db
      .query("associationClaims")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();

    return await Promise.all(
      claims.map(async (c) => {
        const association = await ctx.db.get(c.associationId);
        return { ...c, association };
      }),
    );
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all pending claims (super admin only)
 */
export const listClaims = authQuery({
  args: {
    status: v.optional(
      v.union(
        v.literal(AssociationClaimStatus.Pending),
        v.literal(AssociationClaimStatus.Approved),
        v.literal(AssociationClaimStatus.Rejected),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Check if user is super admin
    if (!isSuperadminUser(ctx.user)) {
      return [];
    }

    let claims;
    if (args.status) {
      claims = await ctx.db
        .query("associationClaims")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      claims = await ctx.db
        .query("associationClaims")
        .withIndex("by_status", (q) =>
          q.eq("status", AssociationClaimStatus.Pending),
        )
        .collect();
    }

    return await Promise.all(
      claims.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        const association = await ctx.db.get(c.associationId);
        const profile =
          user ?
            await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", user._id))
              .unique()
          : null;

        return {
          ...c,
          user:
            user ?
              {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : null,
          profile:
            profile ?
              {
                firstName: profile.identity?.firstName,
                lastName: profile.identity?.lastName,
              }
            : null,
          association,
        };
      }),
    );
  },
});

/**
 * Respond to a claim (super admin only — approve or reject)
 */
export const respondToClaim = authMutation({
  args: {
    claimId: v.id("associationClaims"),
    approve: v.boolean(),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is super admin
    if (!isSuperadminUser(ctx.user)) {
      throw error(ErrorCode.FORBIDDEN, "Only super admins can review claims");
    }

    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw error(ErrorCode.NOT_FOUND, "Claim not found");
    }

    if (claim.status !== AssociationClaimStatus.Pending) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Claim already reviewed");
    }

    const now = Date.now();

    // Update claim status
    await ctx.db.patch(args.claimId, {
      status:
        args.approve ?
          AssociationClaimStatus.Approved
        : AssociationClaimStatus.Rejected,
      reviewedBy: ctx.user._id,
      reviewNote: args.reviewNote,
      reviewedAt: now,
    });

    // If approved, add the claimant as President
    if (args.approve) {
      // Check if user already has a membership
      const existingMembership = await ctx.db
        .query("associationMembers")
        .withIndex("by_user_assoc", (q) =>
          q.eq("userId", claim.userId).eq("associationId", claim.associationId),
        )
        .unique();

      if (existingMembership && !existingMembership.deletedAt) {
        // Promote existing member to President
        await ctx.db.patch(existingMembership._id, {
          role: AssociationRole.President,
        });
      } else if (existingMembership && existingMembership.deletedAt) {
        // Reactivate soft-deleted membership
        await ctx.db.patch(existingMembership._id, {
          role: AssociationRole.President,
          status: AssociationMemberStatus.Accepted,
          joinedAt: now,
          deletedAt: undefined,
        });
      } else {
        // Create new membership as President
        await ctx.db.insert("associationMembers", {
          userId: claim.userId,
          associationId: claim.associationId,
          role: AssociationRole.President,
          status: AssociationMemberStatus.Accepted,
          joinedAt: now,
        });
      }
    }

    return args.claimId;
  },
});
