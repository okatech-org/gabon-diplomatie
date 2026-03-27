/**
 * Child Profiles Schema
 * 
 * Stores minors' profiles linked to their parents.
 * Parents can make requests on behalf of their children.
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  genderValidator,
  childProfileStatusValidator,
  parentalRoleValidator,
  nationalityAcquisitionValidator,
} from "../lib/validators";
import { countryCodeValidator } from "../lib/countryCodeValidator";

// ═══════════════════════════════════════════════════════════════════════════
// PARENT INFO VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

export const parentInfoValidator = v.object({
  profileId: v.optional(v.id("profiles")), // Parent's profile ID if in system
  role: parentalRoleValidator,
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
});

// ═══════════════════════════════════════════════════════════════════════════
// CHILD PROFILES TABLE
// ═══════════════════════════════════════════════════════════════════════════

export const childProfilesTable = defineTable({
  // Owner (parent who created this profile)
  authorUserId: v.id("users"),
  
  // Status
  status: childProfileStatusValidator,
  
  // Country of residence
  countryOfResidence: v.optional(countryCodeValidator),
  
  // Personal info
  identity: v.object({
    firstName: v.string(),
    lastName: v.string(),
    birthDate: v.optional(v.number()), // timestamp
    birthPlace: v.optional(v.string()),
    birthCountry: v.optional(countryCodeValidator),
    gender: v.optional(genderValidator),
    nationality: v.optional(countryCodeValidator),
    nationalityAcquisition: v.optional(nationalityAcquisitionValidator),
  }),
  
  // Passport info
  passportInfo: v.optional(v.object({
    number: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    issueAuthority: v.optional(v.string()),
  })),
  
  // NIP Code (Numéro d'Identification Personnelle)
  nipCode: v.optional(v.string()),
  
  // Consular card
  consularCard: v.optional(v.object({
    cardNumber: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })),
  
  // Parents info
  parents: v.array(parentInfoValidator),
  
  // Documents (references to documents table)
  documents: v.optional(v.object({
    passport: v.optional(v.id("documents")),
    birthCertificate: v.optional(v.id("documents")),
    residencePermit: v.optional(v.id("documents")),
    addressProof: v.optional(v.id("documents")),
    photo: v.optional(v.id("documents")),
  })),
  
  // Registration request ID (if pending registration)
  registrationRequestId: v.optional(v.id("requests")),
  
  // Metadata
  updatedAt: v.optional(v.number()),
})
  .index("by_author", ["authorUserId"])
  .index("by_status", ["status"])
  .searchIndex("search_firstName", { searchField: "identity.firstName" })
  .searchIndex("search_lastName", { searchField: "identity.lastName" });
