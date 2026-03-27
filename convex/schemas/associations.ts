import { defineTable } from "convex/server";
import { v } from "convex/values";
import { associationTypeValidator, addressValidator } from "../lib/validators";
import { countryCodeValidator } from "../lib/countryCodeValidator";

/**
 * Associations table — diaspora associations
 * Separate from orgs (which are consular/diplomatic entities).
 */
export const associationsTable = defineTable({
  slug: v.string(),
  name: v.string(),
  associationType: associationTypeValidator,

  // Location
  country: countryCodeValidator,
  address: v.optional(addressValidator),
  coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),

  // Contact
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  description: v.optional(v.string()),

  // Branding
  logoUrl: v.optional(v.string()),

  // Status
  isActive: v.boolean(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_country", ["country"])
  .index("by_type", ["associationType"])
  .index("by_active", ["isActive", "deletedAt"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["associationType", "isActive", "deletedAt"],
  });
