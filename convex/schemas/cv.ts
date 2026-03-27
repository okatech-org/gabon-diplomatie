/**
 * CV (Curriculum Vitae) Schema
 *
 * Stores professional CV data for citizens.
 * One CV per user (1:1 relationship with profiles).
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";
import { skillLevelValidator, languageLevelValidator } from "../lib/validators";

// ═══════════════════════════════════════════════════════════════════════════
// SUB-VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════

export const experienceValidator = v.object({
  title: v.string(),
  company: v.string(),
  location: v.optional(v.string()),
  startDate: v.string(), // YYYY-MM format
  endDate: v.optional(v.string()),
  current: v.boolean(),
  description: v.optional(v.string()),
});

export const educationValidator = v.object({
  degree: v.string(),
  school: v.string(),
  location: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  current: v.boolean(),
  description: v.optional(v.string()),
});

export const skillValidator = v.object({
  name: v.string(),
  level: skillLevelValidator,
});

export const languageValidator = v.object({
  name: v.string(),
  level: languageLevelValidator,
});

// ═══════════════════════════════════════════════════════════════════════════
// CV TABLE
// ═══════════════════════════════════════════════════════════════════════════

export const cvTable = defineTable({
  // Owner
  userId: v.id("users"),

  // Identity (can differ from profile)
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),

  // Professional identity
  title: v.optional(v.string()), // e.g. "Développeur Full Stack"
  objective: v.optional(v.string()), // Short introductory text

  // Contact info (can differ from profile)
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),

  // Professional summary
  summary: v.optional(v.string()),

  // Experience
  experiences: v.array(experienceValidator),

  // Education
  education: v.array(educationValidator),

  // Skills
  skills: v.array(skillValidator),

  // Languages
  languages: v.array(languageValidator),

  // Hobbies / Interests
  hobbies: v.optional(v.array(v.string())),

  // External links
  portfolioUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),

  // Preferences
  preferredTheme: v.optional(v.string()), // 'modern' | 'classic' | ...
  cvLanguage: v.optional(v.string()), // 'fr' | 'en' | 'es' | ...

  // Visibility settings
  isPublic: v.optional(v.boolean()),

  // Metadata
  updatedAt: v.optional(v.number()),
}).index("by_user", ["userId"]);
