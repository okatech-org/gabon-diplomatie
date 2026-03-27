import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  registrationDurationValidator,
  registrationTypeValidator,
  registrationStatusValidator,
} from "../lib/validators";

/**
 * Consular Registrations table - tracks consular inscriptions per organization
 * Replaces the embedded registrations[] array in profiles
 */
export const consularRegistrationsTable = defineTable({
  profileId: v.optional(v.id("profiles")),
  childProfileId: v.optional(v.id("childProfiles")),
  orgId: v.id("orgs"),
  requestId: v.id("requests"),

  // Duration of stay (set when card is generated)
  duration: v.optional(registrationDurationValidator),

  // Type of operation
  type: registrationTypeValidator,

  // Status (denormalized for efficient queries)
  status: registrationStatusValidator,

  // Dates
  registeredAt: v.number(),
  activatedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),

  // Card info (only for permanent duration)
  cardNumber: v.optional(v.string()),
  cardIssuedAt: v.optional(v.number()),
  cardExpiresAt: v.optional(v.number()),

  printedAt: v.optional(v.number()),
})
  // Composite index covers by_org queries (prefix matching)
  .index("by_org_status", ["orgId", "status"])
  .index("by_profile", ["profileId"])
  .index("by_childProfile", ["childProfileId"])
  .index("by_request", ["requestId"])
  // For EasyCard: find active cards not yet printed
  .index("by_status_printed", ["status", "printedAt"])
  // For public verification by card number
  .index("by_card_number", ["cardNumber"])
  // For listing cards by issue/expiry date per org
  .index("by_org_cardIssued", ["orgId", "cardIssuedAt"])
  .index("by_org_cardExpires", ["orgId", "cardExpiresAt"]);
