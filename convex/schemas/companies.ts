import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  companyTypeValidator,
  activitySectorValidator,
  addressValidator,
} from "../lib/validators";
import { countryCodeValidator } from "../lib/countryCodeValidator";

/**
 * Companies table — registered businesses
 * Separate from orgs (which are consular/diplomatic entities).
 */
export const companiesTable = defineTable({
  slug: v.string(),
  name: v.string(),
  legalName: v.optional(v.string()),
  companyType: companyTypeValidator,
  activitySector: activitySectorValidator,

  // Registration
  siret: v.optional(v.string()),
  registrationNumber: v.optional(v.string()), // Numéro RCCM

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
  .index("by_sector", ["activitySector"])
  .index("by_active", ["isActive", "deletedAt"])
  .searchIndex("search_name", { searchField: "name" });
