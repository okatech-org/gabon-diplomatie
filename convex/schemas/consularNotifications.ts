import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  registrationTypeValidator,
  registrationStatusValidator,
} from "../lib/validators";

/**
 * Consular Notifications (Signalements) table
 * Tracks short-stay (<6 months) presence declarations per organization.
 * Mirrors consularRegistrations but for temporary stays.
 */
export const consularNotificationsTable = defineTable({
  profileId: v.id("profiles"),
  orgId: v.id("orgs"),
  requestId: v.id("requests"),

  // Type of operation (inscription, renewal, modification)
  type: registrationTypeValidator,

  // Status (requested → active → expired)
  status: registrationStatusValidator,

  // Unique notification identifier (format: SIG-CC-YY-NNNNN)
  notificationNumber: v.optional(v.string()),

  // Stay dates
  stayStartDate: v.optional(v.number()),
  stayEndDate: v.optional(v.number()),

  // Timestamps
  signaledAt: v.number(),
  activatedAt: v.optional(v.number()),
})
  .index("by_org_status", ["orgId", "status"])
  .index("by_profile", ["profileId"])
  .index("by_request", ["requestId"])
  .index("by_notification_number", ["notificationNumber"]);
