import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Security Policies — configuration sécurité par organisme
 */
export const securityPoliciesTable = defineTable({
  orgId: v.optional(v.id("orgs")), // null = global policy
  name: v.string(),

  // Authentication
  mfaRequired: v.optional(v.boolean()),
  mfaMethod: v.optional(v.union(v.literal("totp"), v.literal("sms"), v.literal("email"))),

  // Password policy
  passwordMinLength: v.optional(v.number()),
  passwordRequireUppercase: v.optional(v.boolean()),
  passwordRequireNumbers: v.optional(v.boolean()),
  passwordRequireSpecial: v.optional(v.boolean()),
  passwordExpirationDays: v.optional(v.number()),
  passwordHistoryCount: v.optional(v.number()),

  // Sessions
  sessionMaxDurationMinutes: v.optional(v.number()),
  sessionIdleTimeoutMinutes: v.optional(v.number()),
  maxConcurrentSessions: v.optional(v.number()),

  // IP restrictions
  ipWhitelist: v.optional(v.array(v.string())),
  ipBlacklist: v.optional(v.array(v.string())),

  // Lockout
  maxLoginAttempts: v.optional(v.number()),
  lockoutDurationMinutes: v.optional(v.number()),

  // Status
  isActive: v.boolean(),
  createdBy: v.optional(v.id("users")),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})
  .index("by_org", ["orgId"])
  .index("by_active", ["isActive", "deletedAt"]);

/**
 * Maintenance Config — mode maintenance global et planifié
 */
export const maintenanceConfigTable = defineTable({
  // Mode maintenance
  isMaintenanceMode: v.boolean(),
  maintenanceMessage: v.optional(v.string()),
  maintenanceStartedAt: v.optional(v.number()),
  maintenanceEndEstimate: v.optional(v.number()),
  startedBy: v.optional(v.id("users")),

  // Scheduled tasks
  scheduledTasks: v.optional(v.array(v.object({
    key: v.string(),
    label: v.string(),
    schedule: v.string(), // cron expression
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
    isEnabled: v.boolean(),
  }))),

  // System info
  lastBackupAt: v.optional(v.number()),
  lastPurgeAt: v.optional(v.number()),

  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.id("users")),
});
