/**
 * Companies Functions
 *
 * CRUD operations for the dedicated `companies` table.
 * Uses `companyMembers` table for membership with CompanyRole.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { authQuery, authMutation } from "../lib/customFunctions";
import { error, ErrorCode } from "../lib/errors";
import { CompanyRole, CountryCode } from "../lib/constants";
import {
  companyTypeValidator,
  activitySectorValidator,
  companyRoleValidator,
  addressValidator,
} from "../lib/validators";
import { countryCodeValidator } from "../lib/countryCodeValidator";

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all companies (public)
 */
export const list = query({
  args: {
    sector: v.optional(activitySectorValidator),
    country: v.optional(countryCodeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q;
    if (args.sector) {
      q = ctx.db
        .query("companies")
        .withIndex("by_sector", (idx) =>
          idx.eq("activitySector", args.sector!),
        );
    } else if (args.country) {
      q = ctx.db
        .query("companies")
        .withIndex("by_country", (idx) => idx.eq("country", args.country!));
    } else {
      q = ctx.db
        .query("companies")
        .withIndex("by_active", (idx) =>
          idx.eq("isActive", true).eq("deletedAt", undefined),
        );
    }

    const all = await q.collect();
    const active = all.filter((c) => c.isActive && !c.deletedAt);
    return args.limit ? active.slice(0, args.limit) : active;
  },
});

/**
 * Get company by ID with full member details
 */
export const getById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.id);
    if (!company || company.deletedAt) return null;

    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", args.id))
      .collect();

    const activeMembers = memberships.filter((m) => !m.deletedAt);

    const members = await Promise.all(
      activeMembers.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        const profile =
          user ?
            await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", user._id))
              .unique()
          : null;

        return {
          ...m,
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
        };
      }),
    );

    return { ...company, members, memberCount: activeMembers.length };
  },
});

/**
 * Get my companies (where I'm a member)
 */
export const getMine = authQuery({
  args: {},
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const active = memberships.filter((m) => !m.deletedAt);

    const companies = await Promise.all(
      active.map(async (m) => {
        const company = await ctx.db.get(m.companyId);
        if (company && company.isActive && !company.deletedAt) {
          return { ...company, myRole: m.role };
        }
        return null;
      }),
    );

    return companies.filter((c) => c !== null);
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new company
 */
export const create = authMutation({
  args: {
    name: v.string(),
    legalName: v.optional(v.string()),
    companyType: companyTypeValidator,
    activitySector: activitySectorValidator,
    siret: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    country: v.optional(countryCodeValidator),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(addressValidator),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const slug =
      args.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      now.toString(36);

    const companyId = await ctx.db.insert("companies", {
      slug,
      name: args.name,
      legalName: args.legalName,
      companyType: args.companyType,
      activitySector: args.activitySector,
      siret: args.siret,
      registrationNumber: args.registrationNumber,
      country: args.country ?? CountryCode.GA,
      isActive: true,
      email: args.email,
      phone: args.phone,
      website: args.website,
      description: args.description,
      logoUrl: args.logoUrl,
      address: args.address,
      updatedAt: now,
    });

    // Add creator as CEO
    await ctx.db.insert("companyMembers", {
      userId: ctx.user._id,
      companyId,
      role: CompanyRole.CEO,
    });

    return companyId;
  },
});

/**
 * Update company (CEO/Owner/President only)
 */
export const update = authMutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    legalName: v.optional(v.string()),
    companyType: v.optional(companyTypeValidator),
    activitySector: v.optional(activitySectorValidator),
    siret: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(addressValidator),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.id);
    if (!company || company.deletedAt) {
      throw error(ErrorCode.NOT_FOUND, "Company not found");
    }

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", args.id),
      )
      .unique();

    if (!membership || membership.deletedAt) {
      throw error(ErrorCode.FORBIDDEN, "Not a member of this company");
    }

    const adminRoles = [
      CompanyRole.CEO,
      CompanyRole.Owner,
      CompanyRole.President,
    ];
    if (!adminRoles.includes(membership.role as CompanyRole)) {
      throw error(ErrorCode.FORBIDDEN, "Insufficient permissions");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(args.id, { ...updates, updatedAt: Date.now() });
    return args.id;
  },
});

/**
 * Add member to company
 */
export const addMember = authMutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.optional(companyRoleValidator),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company || company.deletedAt) {
      throw error(ErrorCode.NOT_FOUND, "Company not found");
    }

    // Check inviter is admin-level
    const inviterMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", args.companyId),
      )
      .unique();

    if (!inviterMembership || inviterMembership.deletedAt) {
      throw error(ErrorCode.FORBIDDEN, "Not a member of this company");
    }

    // Check existing membership
    const existing = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId),
      )
      .unique();

    if (existing && !existing.deletedAt) {
      throw error(ErrorCode.INVALID_ARGUMENT, "User is already a member");
    }

    if (existing && existing.deletedAt) {
      await ctx.db.patch(existing._id, {
        role: args.role ?? CompanyRole.Manager,
        title: args.title,
        deletedAt: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("companyMembers", {
      userId: args.userId,
      companyId: args.companyId,
      role: args.role ?? CompanyRole.Manager,
      title: args.title,
    });
  },
});

/**
 * Leave company
 */
export const leave = authMutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", args.companyId),
      )
      .unique();

    if (!membership || membership.deletedAt) {
      throw error(ErrorCode.NOT_FOUND, "Membership not found");
    }

    await ctx.db.patch(membership._id, { deletedAt: Date.now() });
    return membership._id;
  },
});

/**
 * Remove member from company (CEO/Owner/President only)
 */
export const removeMember = authMutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const removerMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", args.companyId),
      )
      .unique();

    if (!removerMembership || removerMembership.deletedAt) {
      throw error(ErrorCode.FORBIDDEN, "Not a member of this company");
    }

    const adminRoles = [
      CompanyRole.CEO,
      CompanyRole.Owner,
      CompanyRole.President,
    ];
    if (!adminRoles.includes(removerMembership.role as any)) {
      throw error(ErrorCode.FORBIDDEN, "Insufficient permissions");
    }

    if (args.userId === ctx.user._id) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Use leave() to remove yourself");
    }

    const target = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId),
      )
      .unique();

    if (!target || target.deletedAt) {
      throw error(ErrorCode.NOT_FOUND, "Member not found");
    }

    await ctx.db.patch(target._id, { deletedAt: Date.now() });
    return target._id;
  },
});

/**
 * Update member role (CEO/Owner/President only)
 */
export const updateMemberRole = authMutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: companyRoleValidator,
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", args.companyId),
      )
      .unique();

    if (!adminMembership || adminMembership.deletedAt) {
      throw error(ErrorCode.FORBIDDEN, "Not a member of this company");
    }

    const adminRoles = [
      CompanyRole.CEO,
      CompanyRole.Owner,
      CompanyRole.President,
    ];
    if (!adminRoles.includes(adminMembership.role as any)) {
      throw error(ErrorCode.FORBIDDEN, "Insufficient permissions");
    }

    const target = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId),
      )
      .unique();

    if (!target || target.deletedAt) {
      throw error(ErrorCode.NOT_FOUND, "Member not found");
    }

    await ctx.db.patch(target._id, {
      role: args.role,
      ...(args.title !== undefined ? { title: args.title } : {}),
    });
    return target._id;
  },
});

/**
 * Soft-delete company (CEO/Owner only)
 */
export const deleteCompany = authMutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.id);
    if (!company || company.deletedAt) {
      throw error(ErrorCode.NOT_FOUND, "Company not found");
    }

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", args.id),
      )
      .unique();

    if (!membership || membership.deletedAt) {
      throw error(ErrorCode.FORBIDDEN, "Not a member");
    }

    if (
      membership.role !== CompanyRole.CEO &&
      membership.role !== CompanyRole.Owner
    ) {
      throw error(ErrorCode.FORBIDDEN, "Only CEO or Owner can delete");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      deletedAt: Date.now(),
    });
    return args.id;
  },
});
