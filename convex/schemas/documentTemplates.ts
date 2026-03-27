import { defineTable } from "convex/server";
import { v } from "convex/values";
import { serviceCategoryValidator, localizedStringValidator } from "../lib/validators";

/**
 * Document Templates - PDF templates for generating official documents
 * Templates can be organization-specific or global
 */
export const documentTemplatesTable = defineTable({
	// Basic info
	name: localizedStringValidator,
	description: v.optional(localizedStringValidator),

	// Category - matches service categories
	category: v.optional(serviceCategoryValidator),

	// Link to specific service (optional)
	serviceId: v.optional(v.id("services")),

	// Template type
	templateType: v.union(
		v.literal("certificate"), // Certificats (vie, nationalité, etc.)
		v.literal("attestation"), // Attestations
		v.literal("receipt"), // Reçus/Récépissés
		v.literal("letter"), // Lettres officielles
		v.literal("custom") // Personnalisé
	),

	// Template content - structured for @react-pdf/renderer
	// Contains sections with placeholders like {{firstName}}, {{dateOfBirth}}
	content: v.object({
		// Header configuration
		header: v.optional(
			v.object({
				showLogo: v.boolean(),
				showOrgName: v.boolean(),
				showOrgAddress: v.boolean(),
				title: v.optional(localizedStringValidator),
				subtitle: v.optional(localizedStringValidator),
			})
		),
		// Main body - array of text blocks with placeholders
		body: v.array(
			v.object({
				type: v.union(
					v.literal("paragraph"),
					v.literal("heading"),
					v.literal("list"),
					v.literal("table"),
					v.literal("signature")
				),
				content: localizedStringValidator, // Text with {{placeholders}}
				style: v.optional(
					v.object({
						fontSize: v.optional(v.number()),
						fontWeight: v.optional(v.union(v.literal("normal"), v.literal("bold"))),
						textAlign: v.optional(
							v.union(v.literal("left"), v.literal("center"), v.literal("right"), v.literal("justify"))
						),
						marginTop: v.optional(v.number()),
						marginBottom: v.optional(v.number()),
					})
				),
			})
		),
		// Footer configuration
		footer: v.optional(
			v.object({
				showDate: v.boolean(),
				showSignature: v.boolean(),
				signatureTitle: v.optional(localizedStringValidator),
				additionalText: v.optional(localizedStringValidator),
			})
		),
	}),

	// Available placeholders - auto-detected from request data
	placeholders: v.optional(
		v.array(
			v.object({
				key: v.string(), // e.g., "firstName", "dateOfBirth"
				label: localizedStringValidator,
				source: v.union(
					v.literal("user"), // From user profile
					v.literal("request"), // From request data
					v.literal("formData"), // From dynamic form submission
					v.literal("org"), // From organization
					v.literal("system") // Generated (date, reference, etc.)
				),
				path: v.optional(v.string()), // JSONPath to value, e.g., "formData.identity.firstName"
			})
		)
	),

	// Ownership
	orgId: v.optional(v.id("orgs")), // null = global template
	createdBy: v.optional(v.id("users")),

	// Visibility
	isGlobal: v.boolean(), // Available to all orgs
	isActive: v.boolean(),

	// Paper settings
	paperSize: v.optional(v.union(v.literal("A4"), v.literal("LETTER"))),
	orientation: v.optional(v.union(v.literal("portrait"), v.literal("landscape"))),

	// Metadata
	version: v.optional(v.number()),
	updatedAt: v.optional(v.number()),
})
	.index("by_org", ["orgId", "isActive"])
	.index("by_category", ["category", "isActive"])
	.index("by_service", ["serviceId", "isActive"])
	.index("by_global", ["isGlobal", "isActive"])
	.index("by_type", ["templateType", "isActive"]);
