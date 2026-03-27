/**
 * Delivery Packages Schema
 *
 * Tracks packages (colis) for users within the iBoîte system.
 * Includes an event log for tracking the evolution of each package.
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  packageStatusValidator,
  packageEventValidator,
} from "../lib/validators";

export const deliveryPackagesTable = defineTable({
  // Owner
  userId: v.id("users"),
  organizationId: v.optional(v.id("orgs")),

  // Package info
  trackingNumber: v.string(),
  sender: v.string(),
  description: v.string(),

  // Status
  status: packageStatusValidator,
  estimatedDelivery: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),

  // Physical details
  weight: v.optional(v.number()), // in grams
  dimensions: v.optional(v.string()), // e.g. "30x20x10 cm"

  // Event log — ordered timeline of package events
  events: v.optional(v.array(packageEventValidator)),

  // Notes
  notes: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_status", ["userId", "status"])
  .index("by_tracking", ["trackingNumber"]);
