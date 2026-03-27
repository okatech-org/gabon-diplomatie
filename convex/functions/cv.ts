/**
 * CV Functions
 *
 * CRUD operations for user CVs.
 * One CV per user (1:1 with profiles).
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { authQuery, authMutation } from "../lib/customFunctions";
import { error, ErrorCode } from "../lib/errors";
import { skillLevelValidator, languageLevelValidator } from "../lib/validators";
import {
  experienceValidator,
  educationValidator,
  skillValidator,
  languageValidator,
} from "../schemas/cv";

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current user's CV
 */
export const getMine = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();
  },
});

/**
 * Get CV by user ID (for public profiles)
 */
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    // Only return if public
    if (cv?.isPublic) {
      return cv;
    }
    return null;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create or update CV (upsert)
 */
export const upsert = authMutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    title: v.optional(v.string()),
    objective: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    summary: v.optional(v.string()),
    experiences: v.optional(v.array(experienceValidator)),
    education: v.optional(v.array(educationValidator)),
    skills: v.optional(v.array(skillValidator)),
    languages: v.optional(v.array(languageValidator)),
    hobbies: v.optional(v.array(v.string())),
    portfolioUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    preferredTheme: v.optional(v.string()),
    cvLanguage: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    const updates = {
      ...args,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("cv", {
        userId: ctx.user._id,
        experiences: args.experiences ?? [],
        education: args.education ?? [],
        skills: args.skills ?? [],
        languages: args.languages ?? [],
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPERIENCE MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add experience to CV
 */
export const addExperience = authMutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      // Create CV with this experience
      return await ctx.db.insert("cv", {
        userId: ctx.user._id,
        experiences: [args],
        education: [],
        skills: [],
        languages: [],
        updatedAt: Date.now(),
      });
    }

    const experiences = [...(cv.experiences ?? []), args];
    await ctx.db.patch(cv._id, { experiences, updatedAt: Date.now() });
    return cv._id;
  },
});

/**
 * Update experience
 */
export const updateExperience = authMutation({
  args: {
    index: v.number(),
    title: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      throw error(ErrorCode.NOT_FOUND, "CV not found");
    }

    const { index, ...experience } = args;
    const experiences = [...(cv.experiences ?? [])];

    if (index < 0 || index >= experiences.length) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Invalid experience index");
    }

    experiences[index] = experience;
    await ctx.db.patch(cv._id, { experiences, updatedAt: Date.now() });
    return cv._id;
  },
});

/**
 * Remove experience
 */
export const removeExperience = authMutation({
  args: { index: v.number() },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      throw error(ErrorCode.NOT_FOUND, "CV not found");
    }

    const experiences = [...(cv.experiences ?? [])];

    if (args.index < 0 || args.index >= experiences.length) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Invalid experience index");
    }

    experiences.splice(args.index, 1);
    await ctx.db.patch(cv._id, { experiences, updatedAt: Date.now() });
    return cv._id;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATION MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add education to CV
 */
export const addEducation = authMutation({
  args: {
    degree: v.string(),
    school: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      return await ctx.db.insert("cv", {
        userId: ctx.user._id,
        experiences: [],
        education: [args],
        skills: [],
        languages: [],
        updatedAt: Date.now(),
      });
    }

    const education = [...(cv.education ?? []), args];
    await ctx.db.patch(cv._id, { education, updatedAt: Date.now() });
    return cv._id;
  },
});

/**
 * Remove education
 */
export const removeEducation = authMutation({
  args: { index: v.number() },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      throw error(ErrorCode.NOT_FOUND, "CV not found");
    }

    const education = [...(cv.education ?? [])];

    if (args.index < 0 || args.index >= education.length) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Invalid education index");
    }

    education.splice(args.index, 1);
    await ctx.db.patch(cv._id, { education, updatedAt: Date.now() });
    return cv._id;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// SKILLS MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add skill to CV
 */
export const addSkill = authMutation({
  args: {
    name: v.string(),
    level: skillLevelValidator,
  },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      return await ctx.db.insert("cv", {
        userId: ctx.user._id,
        experiences: [],
        education: [],
        skills: [args],
        languages: [],
        updatedAt: Date.now(),
      });
    }

    // Check for duplicate skill name
    const existingSkill = cv.skills?.find(
      (s) => s.name.toLowerCase() === args.name.toLowerCase(),
    );
    if (existingSkill) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Cette compétence existe déjà");
    }

    const skills = [...(cv.skills ?? []), args];
    await ctx.db.patch(cv._id, { skills, updatedAt: Date.now() });
    return cv._id;
  },
});

/**
 * Remove skill
 */
export const removeSkill = authMutation({
  args: { index: v.number() },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      throw error(ErrorCode.NOT_FOUND, "CV not found");
    }

    const skills = [...(cv.skills ?? [])];

    if (args.index < 0 || args.index >= skills.length) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Invalid skill index");
    }

    skills.splice(args.index, 1);
    await ctx.db.patch(cv._id, { skills, updatedAt: Date.now() });
    return cv._id;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGES MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add language to CV
 */
export const addLanguage = authMutation({
  args: {
    name: v.string(),
    level: languageLevelValidator,
  },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      return await ctx.db.insert("cv", {
        userId: ctx.user._id,
        experiences: [],
        education: [],
        skills: [],
        languages: [args],
        updatedAt: Date.now(),
      });
    }

    // Check for duplicate language name
    const existingLang = cv.languages?.find(
      (l) => l.name.toLowerCase() === args.name.toLowerCase(),
    );
    if (existingLang) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Cette langue existe déjà");
    }

    const languages = [...(cv.languages ?? []), args];
    await ctx.db.patch(cv._id, { languages, updatedAt: Date.now() });
    return cv._id;
  },
});

/**
 * Remove language
 */
export const removeLanguage = authMutation({
  args: { index: v.number() },
  handler: async (ctx, args) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      throw error(ErrorCode.NOT_FOUND, "CV not found");
    }

    const languages = [...(cv.languages ?? [])];

    if (args.index < 0 || args.index >= languages.length) {
      throw error(ErrorCode.INVALID_ARGUMENT, "Invalid language index");
    }

    languages.splice(args.index, 1);
    await ctx.db.patch(cv._id, { languages, updatedAt: Date.now() });
    return cv._id;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Toggle CV visibility
 */
export const toggleVisibility = authMutation({
  args: {},
  handler: async (ctx) => {
    const cv = await ctx.db
      .query("cv")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!cv) {
      throw error(ErrorCode.NOT_FOUND, "CV not found");
    }

    await ctx.db.patch(cv._id, {
      isPublic: !cv.isPublic,
      updatedAt: Date.now(),
    });

    return !cv.isPublic;
  },
});
