import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Document Verifications Schema
 * Stores verification tokens for generated documents with QR codes
 */
export const documentVerificationsTable = defineTable({
	// Reference to the generated document
	documentId: v.id("documents"),
	
	// Reference to the request
	requestId: v.id("requests"),
	
	// Reference to the org
	orgId: v.id("orgs"),
	
	// Unique verification token (UUID)
	verificationToken: v.string(),
	
	// Document metadata for verification display
	documentType: v.string(), // e.g., "certificat_vie", "attestation_residence"
	documentTitle: v.string(),
	
	// Holder information
	holderName: v.string(),
	
	// Generation info
	generatedAt: v.number(),
	generatedBy: v.optional(v.id("users")), // Agent who generated
	
	// Verification tracking
	verificationCount: v.number(),
	lastVerifiedAt: v.optional(v.number()),
	
	// Expiry (optional - some documents have expiry dates)
	expiresAt: v.optional(v.number()),
	
	// Status
	isRevoked: v.boolean(),
	revokedAt: v.optional(v.number()),
	revokedReason: v.optional(v.string()),
})
	.index("by_token", ["verificationToken"])
	.index("by_document", ["documentId"])
	.index("by_request", ["requestId"])
	.index("by_org", ["orgId"]);
