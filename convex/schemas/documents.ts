import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  documentStatusValidator,
  documentTypeCategoryValidator,
  detailedDocumentTypeValidator,
} from "../lib/validators";

/**
 * File object schema for documents
 */
export const fileObjectValidator = v.object({
  storageId: v.id("_storage"),
  filename: v.string(),
  mimeType: v.string(),
  sizeBytes: v.number(),
  uploadedAt: v.number(),
});

/**
 * Documents table - can contain multiple files
 * Polymorphic owner (profile or request)
 * Also serves as the document vault (e-Documents)
 */
export const documentsTable = defineTable({
  ownerId: v.union(v.id("users"), v.id("orgs"), v.id("profiles"), v.id("childProfiles")),

  files: v.array(fileObjectValidator),

  documentType: v.optional(detailedDocumentTypeValidator),
  category: v.optional(documentTypeCategoryValidator),

  label: v.optional(v.string()),

  status: documentStatusValidator,
  validatedBy: v.optional(v.id("users")),
  validatedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),

  expiresAt: v.optional(v.number()),

  updatedAt: v.optional(v.number()),
  // No soft delete - documents are permanently deleted
})
  .index("by_owner", ["ownerId"])
  .index("by_owner_status", ["ownerId", "status"])
  .index("by_category", ["ownerId", "category"]);
