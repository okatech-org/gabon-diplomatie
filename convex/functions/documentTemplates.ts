import { v } from "convex/values";
import { query, internalMutation } from "../_generated/server";
import { authMutation, authQuery } from "../lib/customFunctions";
import { serviceCategoryValidator, localizedStringValidator } from "../lib/validators";
import { ServiceCategory } from "../lib/constants";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List document templates for an organization
 */
export const listByOrg = authQuery({
	args: {
		orgId: v.id("orgs"),
		category: v.optional(serviceCategoryValidator),
		templateType: v.optional(
			v.union(
				v.literal("certificate"),
				v.literal("attestation"),
				v.literal("receipt"),
				v.literal("letter"),
				v.literal("custom")
			)
		),
	},
	handler: async (ctx, args) => {
		// Get org-specific templates
		let templates = await ctx.db
			.query("documentTemplates")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId).eq("isActive", true))
			.collect();

		// Also get global templates
		const globalTemplates = await ctx.db
			.query("documentTemplates")
			.withIndex("by_global", (q) => q.eq("isGlobal", true).eq("isActive", true))
			.collect();

		// Merge and deduplicate
		const allTemplates = [...templates, ...globalTemplates];

		// Filter by category if provided
		let filtered = allTemplates;
		if (args.category) {
			filtered = filtered.filter((t) => t.category === args.category);
		}

		// Filter by type if provided
		if (args.templateType) {
			filtered = filtered.filter((t) => t.templateType === args.templateType);
		}

		return filtered;
	},
});

/**
 * Get a single template by ID
 */
export const getById = authQuery({
	args: { templateId: v.id("documentTemplates") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.templateId);
	},
});

/**
 * List templates available for a specific service
 */
export const listForService = authQuery({
	args: {
		serviceId: v.id("services"),
		orgId: v.optional(v.id("orgs")),
	},
	handler: async (ctx, args) => {
		// Get templates linked to this service
		const serviceTemplates = await ctx.db
			.query("documentTemplates")
			.withIndex("by_service", (q) => q.eq("serviceId", args.serviceId).eq("isActive", true))
			.collect();

		// Get global templates
		const globalTemplates = await ctx.db
			.query("documentTemplates")
			.withIndex("by_global", (q) => q.eq("isGlobal", true).eq("isActive", true))
			.collect();

		// If orgId provided, also get org templates
		let orgTemplates: any[] = [];
		if (args.orgId) {
			orgTemplates = await ctx.db
				.query("documentTemplates")
				.withIndex("by_org", (q) => q.eq("orgId", args.orgId).eq("isActive", true))
				.collect();
		}

		// Merge and deduplicate by ID
		const all = [...serviceTemplates, ...globalTemplates, ...orgTemplates];
		const unique = Array.from(new Map(all.map((t) => [t._id, t])).values());

		return unique;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new document template
 */
export const create = authMutation({
	args: {
		name: localizedStringValidator,
		description: v.optional(localizedStringValidator),
		category: v.optional(serviceCategoryValidator),
		serviceId: v.optional(v.id("services")),
		templateType: v.union(
			v.literal("certificate"),
			v.literal("attestation"),
			v.literal("receipt"),
			v.literal("letter"),
			v.literal("custom")
		),
		content: v.any(), // Complex nested structure validated at runtime
		placeholders: v.optional(v.array(v.any())),
		orgId: v.optional(v.id("orgs")),
		isGlobal: v.boolean(),
		paperSize: v.optional(v.union(v.literal("A4"), v.literal("LETTER"))),
		orientation: v.optional(v.union(v.literal("portrait"), v.literal("landscape"))),
	},
	handler: async (ctx, args) => {
		const userId = ctx.user._id;

		return await ctx.db.insert("documentTemplates", {
			...args,
			createdBy: userId,
			isActive: true,
			version: 1,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update an existing template
 */
export const update = authMutation({
	args: {
		templateId: v.id("documentTemplates"),
		name: v.optional(localizedStringValidator),
		description: v.optional(localizedStringValidator),
		category: v.optional(serviceCategoryValidator),
		serviceId: v.optional(v.id("services")),
		templateType: v.optional(
			v.union(
				v.literal("certificate"),
				v.literal("attestation"),
				v.literal("receipt"),
				v.literal("letter"),
				v.literal("custom")
			)
		),
		content: v.optional(v.any()),
		placeholders: v.optional(v.array(v.any())),
		isGlobal: v.optional(v.boolean()),
		isActive: v.optional(v.boolean()),
		paperSize: v.optional(v.union(v.literal("A4"), v.literal("LETTER"))),
		orientation: v.optional(v.union(v.literal("portrait"), v.literal("landscape"))),
	},
	handler: async (ctx, args) => {
		const { templateId, ...updates } = args;

		const template = await ctx.db.get(templateId);
		if (!template) {
			throw new Error("Template not found");
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined)
		);

		// Increment version if content changed
		const version = updates.content ? (template.version || 1) + 1 : template.version;

		await ctx.db.patch(templateId, {
			...cleanUpdates,
			version,
			updatedAt: Date.now(),
		});

		return templateId;
	},
});

/**
 * Delete (soft) a template
 */
export const remove = authMutation({
	args: { templateId: v.id("documentTemplates") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.templateId, {
			isActive: false,
			updatedAt: Date.now(),
		});
		return true;
	},
});

// ============================================================================
// SEED - Default templates
// ============================================================================

/**
 * Seed default document templates
 */
export const seedDefaultTemplates = internalMutation({
	args: {},
	handler: async (ctx) => {
		const defaultTemplates = [
			{
				name: { fr: "Certificat de Vie", en: "Life Certificate" },
				description: {
					fr: "Attestation certifiant que le titulaire est en vie",
					en: "Certificate attesting that the holder is alive",
				},
				category: ServiceCategory.Certification,
				templateType: "certificate" as const,
				content: {
					header: {
						showLogo: true,
						showOrgName: true,
						showOrgAddress: true,
						title: { fr: "CERTIFICAT DE VIE", en: "LIFE CERTIFICATE" },
						subtitle: { fr: "République Gabonaise", en: "Gabonese Republic" },
					},
					body: [
						{
							type: "paragraph" as const,
							content: {
								fr: "Je soussigné, Consul Général du Gabon, certifie que :",
								en: "I, the undersigned, Consul General of Gabon, hereby certify that:",
							},
							style: { marginTop: 20, marginBottom: 10 },
						},
						{
							type: "paragraph" as const,
							content: {
								fr: "{{civilité}} {{firstName}} {{lastName}}, né(e) le {{dateOfBirth}} à {{placeOfBirth}}, de nationalité gabonaise, demeurant à {{address}}, s'est présenté(e) personnellement au Consulat et a été reconnu(e) comme étant en vie à la date du présent certificat.",
								en: "{{civility}} {{firstName}} {{lastName}}, born on {{dateOfBirth}} in {{placeOfBirth}}, of Gabonese nationality, residing at {{address}}, has personally appeared at the Consulate and has been recognized as being alive as of the date of this certificate.",
							},
							style: { textAlign: "justify" as const, marginTop: 15 },
						},
						{
							type: "paragraph" as const,
							content: {
								fr: "En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.",
								en: "In witness whereof, this certificate is issued for whatever legal purpose it may serve.",
							},
							style: { marginTop: 20, textAlign: "justify" as const },
						},
					],
					footer: {
						showDate: true,
						showSignature: true,
						signatureTitle: { fr: "Le Consul Général", en: "The Consul General" },
					},
				},
				placeholders: [
					{ key: "civilité", label: { fr: "Civilité", en: "Title" }, source: "formData" as const },
					{ key: "firstName", label: { fr: "Prénom", en: "First Name" }, source: "user" as const },
					{ key: "lastName", label: { fr: "Nom", en: "Last Name" }, source: "user" as const },
					{ key: "dateOfBirth", label: { fr: "Date de naissance", en: "Date of Birth" }, source: "user" as const },
					{ key: "placeOfBirth", label: { fr: "Lieu de naissance", en: "Place of Birth" }, source: "user" as const },
					{ key: "address", label: { fr: "Adresse", en: "Address" }, source: "user" as const },
				],
				isGlobal: true,
				isActive: true,
				paperSize: "A4" as const,
				orientation: "portrait" as const,
			},
			{
				name: { fr: "Attestation de Résidence", en: "Residence Certificate" },
				description: {
					fr: "Attestation de domicile à l'étranger",
					en: "Certificate of residence abroad",
				},
				category: ServiceCategory.Certification,
				templateType: "attestation" as const,
				content: {
					header: {
						showLogo: true,
						showOrgName: true,
						showOrgAddress: true,
						title: { fr: "ATTESTATION DE RÉSIDENCE", en: "RESIDENCE CERTIFICATE" },
					},
					body: [
						{
							type: "paragraph" as const,
							content: {
								fr: "Le Consul Général du Gabon atteste que :",
								en: "The Consul General of Gabon certifies that:",
							},
							style: { marginTop: 20 },
						},
						{
							type: "paragraph" as const,
							content: {
								fr: "{{civilité}} {{firstName}} {{lastName}}, de nationalité gabonaise, est inscrit(e) au registre des Gabonais établis dans la circonscription consulaire depuis le {{registrationDate}}.",
								en: "{{civility}} {{firstName}} {{lastName}}, of Gabonese nationality, has been registered in the consular district since {{registrationDate}}.",
							},
							style: { marginTop: 15, textAlign: "justify" as const },
						},
						{
							type: "paragraph" as const,
							content: {
								fr: "L'intéressé(e) réside à l'adresse suivante : {{address}}, {{city}}, {{country}}.",
								en: "The above-mentioned person resides at: {{address}}, {{city}}, {{country}}.",
							},
							style: { marginTop: 15 },
						},
					],
					footer: {
						showDate: true,
						showSignature: true,
						signatureTitle: { fr: "Le Consul Général", en: "The Consul General" },
					},
				},
				placeholders: [
					{ key: "civilité", label: { fr: "Civilité", en: "Title" }, source: "formData" as const },
					{ key: "firstName", label: { fr: "Prénom", en: "First Name" }, source: "user" as const },
					{ key: "lastName", label: { fr: "Nom", en: "Last Name" }, source: "user" as const },
					{ key: "registrationDate", label: { fr: "Date d'inscription", en: "Registration Date" }, source: "system" as const },
					{ key: "address", label: { fr: "Adresse", en: "Address" }, source: "user" as const },
					{ key: "city", label: { fr: "Ville", en: "City" }, source: "user" as const },
					{ key: "country", label: { fr: "Pays", en: "Country" }, source: "user" as const },
				],
				isGlobal: true,
				isActive: true,
				paperSize: "A4" as const,
				orientation: "portrait" as const,
			},
			{
				name: { fr: "Récépissé de Dépôt", en: "Filing Receipt" },
				description: {
					fr: "Accusé de réception pour une demande déposée",
					en: "Receipt for a submitted request",
				},
				category: ServiceCategory.Certification,
				templateType: "receipt" as const,
				content: {
					header: {
						showLogo: true,
						showOrgName: true,
						showOrgAddress: false,
						title: { fr: "RÉCÉPISSÉ DE DÉPÔT", en: "FILING RECEIPT" },
					},
					body: [
						{
							type: "paragraph" as const,
							content: {
								fr: "Le Consulat Général du Gabon accuse réception de la demande suivante :",
								en: "The Consulate General of Gabon acknowledges receipt of the following request:",
							},
							style: { marginTop: 20 },
						},
						{
							type: "paragraph" as const,
							content: {
								fr: "**Référence :** {{requestReference}}\n**Type de demande :** {{requestType}}\n**Déposé par :** {{firstName}} {{lastName}}\n**Date de dépôt :** {{submissionDate}}",
								en: "**Reference:** {{requestReference}}\n**Request Type:** {{requestType}}\n**Submitted by:** {{firstName}} {{lastName}}\n**Submission Date:** {{submissionDate}}",
							},
							style: { marginTop: 15 },
						},
						{
							type: "paragraph" as const,
							content: {
								fr: "Ce récépissé ne préjuge en rien de la décision finale qui sera prise sur votre demande. Un traitement dans un délai de {{estimatedDays}} jours ouvrables est prévu, sauf mention contraire.",
								en: "This receipt does not prejudge the final decision on your request. Processing within {{estimatedDays}} business days is expected, unless otherwise indicated.",
							},
							style: { marginTop: 15, textAlign: "justify" as const },
						},
					],
					footer: {
						showDate: true,
						showSignature: false,
						additionalText: {
							fr: "Conservez ce récépissé, il vous sera demandé lors du retrait.",
							en: "Keep this receipt, it will be required upon collection.",
						},
					},
				},
				placeholders: [
					{ key: "requestReference", label: { fr: "Référence", en: "Reference" }, source: "request" as const },
					{ key: "requestType", label: { fr: "Type de demande", en: "Request Type" }, source: "request" as const },
					{ key: "firstName", label: { fr: "Prénom", en: "First Name" }, source: "user" as const },
					{ key: "lastName", label: { fr: "Nom", en: "Last Name" }, source: "user" as const },
					{ key: "submissionDate", label: { fr: "Date de dépôt", en: "Submission Date" }, source: "request" as const },
					{ key: "estimatedDays", label: { fr: "Délai estimé", en: "Estimated Days" }, source: "request" as const },
				],
				isGlobal: true,
				isActive: true,
				paperSize: "A4" as const,
				orientation: "portrait" as const,
			},
		];

		// Insert templates
		for (const template of defaultTemplates) {
			// Check if already exists
			const existing = await ctx.db
				.query("documentTemplates")
				.filter((q) =>
					q.and(
						q.eq(q.field("name"), template.name),
						q.eq(q.field("isGlobal"), true)
					)
				)
				.first();

			if (!existing) {
				await ctx.db.insert("documentTemplates", {
					...template,
					version: 1,
					updatedAt: Date.now(),
				});
			}
		}

		return { seeded: defaultTemplates.length };
	},
});
