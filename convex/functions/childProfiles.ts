/**
 * Child Profiles Functions
 * 
 * CRUD operations for minor profiles.
 * Parents can create and manage profiles for their children.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { authQuery, authMutation } from "../lib/customFunctions";
import { error, ErrorCode } from "../lib/errors";
import { ChildProfileStatus } from "../lib/constants";
import {
  genderValidator,
  childProfileStatusValidator,
  nationalityAcquisitionValidator,
} from "../lib/validators";
import { countryCodeValidator } from "../lib/countryCodeValidator";
import { parentInfoValidator } from "../schemas/childProfiles";

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get my children profiles
 */
export const getMine = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("childProfiles")
      .withIndex("by_author", (q) => q.eq("authorUserId", ctx.user._id))
      .collect();
  },
});

/**
 * Get child profile by ID
 */
export const getById = authQuery({
  args: { id: v.id("childProfiles") },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      return null;
    }

    // Only author can view
    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    // Fetch associated documents if any
    const documents: Record<string, unknown> = {};
    if (child.documents) {
      const docKeys = Object.keys(child.documents) as Array<
        keyof typeof child.documents
      >;
      for (const key of docKeys) {
        const docId = child.documents[key];
        if (docId) {
          documents[key] = await ctx.db.get(docId);
        }
      }
    }

    return {
      ...child,
      documentsData: documents,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a child profile
 */
export const create = authMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    birthDate: v.optional(v.number()),
    birthPlace: v.optional(v.string()),
    birthCountry: v.optional(countryCodeValidator),
    gender: v.optional(genderValidator),
    nationality: v.optional(countryCodeValidator),
    nationalityAcquisition: v.optional(nationalityAcquisitionValidator),
    countryOfResidence: v.optional(countryCodeValidator),
    parents: v.array(parentInfoValidator),
  },
  handler: async (ctx, args) => {
    const { firstName, lastName, birthDate, birthPlace, birthCountry, gender, nationality, nationalityAcquisition, countryOfResidence, parents } = args;

    return await ctx.db.insert("childProfiles", {
      authorUserId: ctx.user._id,
      status: ChildProfileStatus.Draft,
      countryOfResidence,
      identity: {
        firstName,
        lastName,
        birthDate,
        birthPlace,
        birthCountry,
        gender,
        nationality,
        nationalityAcquisition,
      },
      parents: parents.length > 0 ? parents : [],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update child profile
 */
export const update = authMutation({
  args: {
    id: v.id("childProfiles"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    birthPlace: v.optional(v.string()),
    birthCountry: v.optional(countryCodeValidator),
    gender: v.optional(genderValidator),
    nationality: v.optional(countryCodeValidator),
    nationalityAcquisition: v.optional(nationalityAcquisitionValidator),
    countryOfResidence: v.optional(countryCodeValidator),
    nipCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    const { id, ...updates } = args;

    // Build identity updates
    const identityUpdates: Record<string, unknown> = { ...child.identity };
    if (updates.firstName) identityUpdates.firstName = updates.firstName;
    if (updates.lastName) identityUpdates.lastName = updates.lastName;
    if (updates.birthDate) identityUpdates.birthDate = updates.birthDate;
    if (updates.birthPlace) identityUpdates.birthPlace = updates.birthPlace;
    if (updates.birthCountry) identityUpdates.birthCountry = updates.birthCountry;
    if (updates.gender) identityUpdates.gender = updates.gender;
    if (updates.nationality) identityUpdates.nationality = updates.nationality;
    if (updates.nationalityAcquisition) identityUpdates.nationalityAcquisition = updates.nationalityAcquisition;

    await ctx.db.patch(args.id, {
      identity: identityUpdates as typeof child.identity,
      countryOfResidence: updates.countryOfResidence ?? child.countryOfResidence,
      nipCode: updates.nipCode ?? child.nipCode,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Update passport info
 */
export const updatePassport = authMutation({
  args: {
    id: v.id("childProfiles"),
    number: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    issueAuthority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    const { id, ...passportInfo } = args;

    await ctx.db.patch(args.id, {
      passportInfo,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Update consular card
 */
export const updateConsularCard = authMutation({
  args: {
    id: v.id("childProfiles"),
    cardNumber: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    const { id, ...consularCard } = args;

    await ctx.db.patch(args.id, {
      consularCard,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Add/update parent info
 */
export const setParents = authMutation({
  args: {
    id: v.id("childProfiles"),
    parents: v.array(parentInfoValidator),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    await ctx.db.patch(args.id, {
      parents: args.parents,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Link document to child profile
 */
export const linkDocument = authMutation({
  args: {
    id: v.id("childProfiles"),
    documentType: v.union(
      v.literal("passport"),
      v.literal("birthCertificate"),
      v.literal("residencePermit"),
      v.literal("addressProof"),
      v.literal("photo")
    ),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    const documents = { ...(child.documents ?? {}) };
    documents[args.documentType] = args.documentId;

    await ctx.db.patch(args.id, {
      documents,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Submit child profile for validation
 */
export const submit = authMutation({
  args: { id: v.id("childProfiles") },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    if (child.status !== ChildProfileStatus.Draft) {
      throw error(ErrorCode.VALIDATION_ERROR, "Profile already submitted");
    }

    await ctx.db.patch(args.id, {
      status: ChildProfileStatus.Pending,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Delete child profile (soft delete via status)
 */
export const remove = authMutation({
  args: { id: v.id("childProfiles") },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.id);
    
    if (!child) {
      throw error(ErrorCode.NOT_FOUND, "Child profile not found");
    }

    if (child.authorUserId !== ctx.user._id) {
      throw error(ErrorCode.FORBIDDEN, "Access denied");
    }

    await ctx.db.patch(args.id, {
      status: ChildProfileStatus.Inactive,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
