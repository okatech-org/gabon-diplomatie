import { v } from "convex/values";
import { query } from "../_generated/server";
import { authMutation, superadminMutation } from "../lib/customFunctions";
import { getMembership } from "../lib/auth";
import { assertCanDoTask } from "../lib/permissions";
import { error, ErrorCode } from "../lib/errors";
import { logCortexAction } from "../lib/neocortex";
import { SIGNAL_TYPES, CATEGORIES_ACTION } from "../lib/types";
import {
  serviceCategoryValidator,
  localizedStringValidator,
  pricingValidator,
  formDocumentValidator,
  formSchemaValidator,
  eligibleProfilesValidator,
  CountryCode,
} from "../lib/validators";
import { fileObjectValidator } from "../schemas/documents";

// ============================================================================
// GLOBAL SERVICES CATALOG (Superadmin)
// ============================================================================

/**
 * List all active services in catalog
 */
export const listCatalog = query({
  args: {
    category: v.optional(serviceCategoryValidator),
  },
  handler: async (ctx, args) => {
    let services;
    if (args.category) {
      services = await ctx.db
        .query("services")
        .withIndex("by_category_active", (q) => q.eq("category", args.category!).eq("isActive", true))
        .take(100);
    } else {
      services = await ctx.db
        .query("services")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .take(200);
    }

    return services;
  },
});

/**
 * Get service by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const service = await ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!service) return null;

    // Resolve formFiles URLs for public download
    let formFilesWithUrls: Array<{
      storageId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      url: string | null;
    }> | undefined;

    if (service.formFiles && service.formFiles.length > 0) {
      formFilesWithUrls = await Promise.all(
        service.formFiles.map(async (file) => ({
          storageId: file.storageId,
          filename: file.filename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          url: await ctx.storage.getUrl(file.storageId),
        })),
      );
    }

    return {
      ...service,
      formFilesWithUrls,
    };
  },
});

/**
 * Get service by ID
 */
export const getById = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.serviceId);
  },
});

/**
 * Create a new service (superadmin only)
 */
export const create = superadminMutation({
  args: {
    slug: v.string(),
    code: v.string(),
    name: localizedStringValidator,
    description: localizedStringValidator,
    content: v.optional(localizedStringValidator),
    category: serviceCategoryValidator,
    icon: v.optional(v.string()),
    estimatedDays: v.number(),
    requiresAppointment: v.boolean(),
    requiresPickupAppointment: v.boolean(),
    joinedDocuments: v.optional(v.array(formDocumentValidator)),
    formSchema: v.optional(formSchemaValidator),
    eligibleProfiles: v.optional(eligibleProfilesValidator),
    formFiles: v.optional(v.array(fileObjectValidator)),
  },
  handler: async (ctx, args) => {
    // Check slug uniqueness
    const existing = await ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw error(ErrorCode.SERVICE_SLUG_EXISTS);
    }

    const serviceId = await ctx.db.insert("services", {
      ...args,
      isActive: true,
      updatedAt: Date.now(),
    });

    await logCortexAction(ctx, {
      action: "CREATE_SERVICE",
      categorie: CATEGORIES_ACTION.METIER,
      entiteType: "services",
      entiteId: serviceId,
      userId: ctx.user._id,
      apres: { slug: args.slug, code: args.code, category: args.category },
      signalType: SIGNAL_TYPES.SERVICE_CREE,
    });

    return serviceId;
  },
});

/**
 * Update a service (superadmin only)
 */
export const update = superadminMutation({
  args: {
    serviceId: v.id("services"),
    name: v.optional(localizedStringValidator),
    description: v.optional(localizedStringValidator),
    content: v.optional(localizedStringValidator),
    category: v.optional(serviceCategoryValidator),
    icon: v.optional(v.string()),
    estimatedDays: v.optional(v.number()),
    requiresAppointment: v.optional(v.boolean()),
    requiredDocuments: v.optional(v.array(formDocumentValidator)),
    formSchema: v.optional(formSchemaValidator),
    eligibleProfiles: v.optional(eligibleProfilesValidator),
    isActive: v.optional(v.boolean()),
    formFiles: v.optional(v.array(fileObjectValidator)),
  },
  handler: async (ctx, args) => {
    const { serviceId, ...updates } = args;

    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    await ctx.db.patch(serviceId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    await logCortexAction(ctx, {
      action: "UPDATE_SERVICE",
      categorie: CATEGORIES_ACTION.METIER,
      entiteType: "services",
      entiteId: serviceId,
      userId: ctx.user._id,
      apres: cleanUpdates,
      signalType: SIGNAL_TYPES.SERVICE_MODIFIE,
    });

    return serviceId;
  },
});

// ============================================================================
// ORG SERVICES (Organization-specific)
// ============================================================================

/**
 * List services available for an organization
 */
export const listByOrg = query({
  args: {
    orgId: v.id("orgs"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const activeOnly = args.activeOnly !== false;

    const orgServices =
      activeOnly ?
        await ctx.db
          .query("orgServices")
          .withIndex("by_org_active", (q) =>
            q.eq("orgId", args.orgId).eq("isActive", true),
          )
          .take(100)
      : await ctx.db
          .query("orgServices")
          .withIndex("by_org_service", (q) => q.eq("orgId", args.orgId))
          .take(100);

    // Batch fetch services (avoid N+1)
    const serviceIds = [...new Set(orgServices.map((os) => os.serviceId))];
    const services = await Promise.all(serviceIds.map((id) => ctx.db.get(id)));
    const serviceMap = new Map(
      services.filter(Boolean).map((s) => [s!._id, s!]),
    );

    return orgServices.map((os) => {
      const service = serviceMap.get(os.serviceId);
      return {
        ...os,
        service,
        // Merged view for convenience
        name: service?.name,
        category: service?.category,
        description: service?.description,
        // Documents from service definition
        joinedDocuments: service?.joinedDocuments ?? [],
      };
    });
  },
});

/**
 * Get org service by ID with full details
 */
export const getOrgServiceById = query({
  args: { orgServiceId: v.id("orgServices") },
  handler: async (ctx, args) => {
    const orgService = await ctx.db.get(args.orgServiceId);
    if (!orgService) return null;

    const [service, org] = await Promise.all([
      ctx.db.get(orgService.serviceId),
      ctx.db.get(orgService.orgId),
    ]);

    return {
      ...orgService,
      service,
      org,
      // Merged view
      name: service?.name,
      category: service?.category,
      description: service?.description,
      // Form schema and documents from service definition
      formSchema: service?.formSchema,
      joinedDocuments:
        service?.formSchema?.joinedDocuments ?? service?.joinedDocuments ?? [],
      estimatedDays: orgService.estimatedDays ?? service?.estimatedDays,
    };
  },
});

/**
 * Get org service by the parent service's slug
 * Used by citizen-facing routes to fetch service by its human-readable slug
 */
export const getOrgServiceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // First, find the service by slug
    const service = await ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!service) return null;

    // Find an active orgService for this service
    const orgService = await ctx.db
      .query("orgServices")
      .withIndex("by_service_active", (q) =>
        q.eq("serviceId", service._id).eq("isActive", true)
      )
      .first();

    if (!orgService) return null;

    const org = await ctx.db.get(orgService.orgId);

    return {
      ...orgService,
      service,
      org,
      title: service.name,
      name: service.name,
      category: service.category,
      description: service.description,
      formSchema: service.formSchema,
      estimatedDays: orgService.estimatedDays ?? service.estimatedDays,
    };
  },
});

/**
 * Activate a service for an organization
 */
export const activateForOrg = authMutation({
  args: {
    orgId: v.id("orgs"),
    serviceId: v.id("services"),
    pricing: pricingValidator,
    estimatedDays: v.optional(v.number()),
    depositInstructions: v.optional(v.string()),
    pickupInstructions: v.optional(v.string()),
    requiresAppointment: v.optional(v.boolean()),
    requiresAppointmentForPickup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const membership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "settings.manage");

    // Check if already activated
    const existing = await ctx.db
      .query("orgServices")
      .withIndex("by_org_service", (q) =>
        q.eq("orgId", args.orgId).eq("serviceId", args.serviceId),
      )
      .unique();

    if (existing) {
      throw error(ErrorCode.SERVICE_ALREADY_ACTIVATED);
    }

    return await ctx.db.insert("orgServices", {
      orgId: args.orgId,
      serviceId: args.serviceId,
      pricing: args.pricing,
      estimatedDays: args.estimatedDays,
      depositInstructions: args.depositInstructions,
      pickupInstructions: args.pickupInstructions,
      requiresAppointment: args.requiresAppointment ?? false,
      requiresAppointmentForPickup: args.requiresAppointmentForPickup ?? false,
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update org service configuration
 */
export const updateOrgService = authMutation({
  args: {
    orgServiceId: v.id("orgServices"),
    pricing: v.optional(pricingValidator),
    estimatedDays: v.optional(v.number()),
    depositInstructions: v.optional(v.string()),
    pickupInstructions: v.optional(v.string()),
    requiresAppointment: v.optional(v.boolean()),
    requiresAppointmentForPickup: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const orgService = await ctx.db.get(args.orgServiceId);
    if (!orgService) {
      throw error(ErrorCode.SERVICE_NOT_FOUND);
    }

    const membership = await getMembership(ctx, ctx.user._id, orgService.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "settings.manage");

    const { orgServiceId, ...updates } = args;

    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    await ctx.db.patch(orgServiceId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return orgServiceId;
  },
});

/**
 * Toggle org service active status
 */
export const toggleOrgServiceActive = authMutation({
  args: { orgServiceId: v.id("orgServices") },
  handler: async (ctx, args) => {
    const orgService = await ctx.db.get(args.orgServiceId);
    if (!orgService) {
      throw error(ErrorCode.SERVICE_NOT_FOUND);
    }

    const membership = await getMembership(ctx, ctx.user._id, orgService.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "settings.manage");

    await ctx.db.patch(args.orgServiceId, {
      isActive: !orgService.isActive,
      updatedAt: Date.now(),
    });

    return !orgService.isActive;
  },
});

/**
 * Get org service by Org ID and Service ID
 */
export const getByOrgAndService = query({
  args: {
    orgId: v.id("orgs"),
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const orgService = await ctx.db
      .query("orgServices")
      .withIndex("by_org_service", (q) =>
        q.eq("orgId", args.orgId).eq("serviceId", args.serviceId),
      )
      .unique();

    if (!orgService) return null;

    const [service, org] = await Promise.all([
      ctx.db.get(orgService.serviceId),
      ctx.db.get(orgService.orgId),
    ]);

    return {
      ...orgService,
      service,
      org,
      name: service?.name,
      category: service?.category,
      description: service?.description,
      // Form schema and documents from service definition
      formSchema: service?.formSchema,
      joinedDocuments:
        service?.formSchema?.joinedDocuments ?? service?.joinedDocuments ?? [],
      estimatedDays: orgService.estimatedDays ?? service?.estimatedDays,
    };
  },
});

/**
 * List services by country (for user discovery)
 */
export const listByCountry = query({
  args: {
    country: v.string(),
    category: v.optional(serviceCategoryValidator),
  },
  handler: async (ctx, args) => {
    // Get orgs in country
    const orgs = await ctx.db
      .query("orgs")
      .withIndex("by_country", (q) =>
        q.eq("country", args.country as CountryCode),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("deletedAt"), undefined),
        ),
      )
      .take(200);

    if (orgs.length === 0) return [];

    // Get all active org services
    const allOrgServices = await Promise.all(
      orgs.map(async (org) => {
        const services = await ctx.db
          .query("orgServices")
          .withIndex("by_org_active", (q) =>
            q.eq("orgId", org._id).eq("isActive", true),
          )
          .take(100);
        return services.map((s) => ({ ...s, org }));
      }),
    );

    const flatServices = allOrgServices.flat();

    // Batch fetch service details
    const serviceIds = [...new Set(flatServices.map((os) => os.serviceId))];
    const services = await Promise.all(serviceIds.map((id) => ctx.db.get(id)));
    const serviceMap = new Map(
      services.filter(Boolean).map((s) => [s!._id, s!]),
    );

    const enriched = flatServices.map((os) => {
      const service = serviceMap.get(os.serviceId);
      return {
        ...os,
        service,
        name: service?.name,
        category: service?.category,
        description: service?.description,
      };
    });

    if (args.category) {
      return enriched.filter((s) => s.category === args.category);
    }

    return enriched;
  },
});

/**
 * Get registration service availability for an organization
 * Returns the org service if registration category is active, null otherwise
 */
export const getRegistrationServiceForOrg = query({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    // Get all active org services for this org
    const orgServices = await ctx.db
      .query("orgServices")
      .withIndex("by_org_active", (q) =>
        q.eq("orgId", args.orgId).eq("isActive", true),
      )
      .take(100);

    if (orgServices.length === 0) return null;

    // Get all service details to check category
    const serviceIds = [...new Set(orgServices.map((os) => os.serviceId))];
    const services = await Promise.all(serviceIds.map((id) => ctx.db.get(id)));
    const serviceMap = new Map(
      services.filter(Boolean).map((s) => [s!._id, s!]),
    );

    // Find a registration service
    for (const os of orgServices) {
      const service = serviceMap.get(os.serviceId);
      if (service?.category === "registration" && service.isActive) {
        const org = await ctx.db.get(args.orgId);
        return {
          ...os,
          service,
          org,
          name: service.name,
          category: service.category,
          description: service.description,
          // Form schema and documents from service definition
          formSchema: service.formSchema,
          joinedDocuments:
            service.formSchema?.joinedDocuments ??
            service.joinedDocuments ??
            [],
          estimatedDays: os.estimatedDays ?? service.estimatedDays,
        };
      }
    }

    return null;
  },
});

/**
 * Check if a service is available online for a specific country.
 * A service is available if there's an active orgService linked to it,
 * where the org has the user's country in its jurisdictionCountries.
 *
 * @returns { isAvailable: boolean, orgService?: OrgService, org?: Org }
 */
export const getServiceAvailabilityByCountry = query({
  args: {
    serviceId: v.id("services"),
    userCountry: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all active orgServices for this service
    const allOrgServices = await ctx.db
      .query("orgServices")
      .withIndex("by_service_active", (q) =>
        q.eq("serviceId", args.serviceId).eq("isActive", true)
      )
      .take(100);

    if (allOrgServices.length === 0) {
      return { isAvailable: false };
    }

    // Check each org's jurisdictionCountries
    for (const orgService of allOrgServices) {
      const org = await ctx.db.get(orgService.orgId);

      if (!org || !org.isActive || org.deletedAt) continue;

      const jurisdictions = org.jurisdictionCountries ?? [];

      // Check if user's country is in org's jurisdiction
      if (jurisdictions.includes(args.userCountry as CountryCode)) {
        const service = await ctx.db.get(orgService.serviceId);
        return {
          isAvailable: true,
          orgService,
          org,
          service,
        };
      }
    }

    return { isAvailable: false };
  },
});

/**
 * Get all available service IDs for a specific country.
 * Used for batch checking on listings.
 */
export const getAvailableServiceIdsForCountry = query({
  args: {
    userCountry: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all orgs that have this country in their jurisdiction
    const allOrgs = await ctx.db
      .query("orgs")
      .withIndex("by_active_notDeleted", (q) =>
        q.eq("isActive", true).eq("deletedAt", undefined)
      )
      .take(200);

    // Filter orgs by jurisdiction
    const matchingOrgs = allOrgs.filter((org) => {
      const jurisdictions = org.jurisdictionCountries ?? [];
      return jurisdictions.includes(args.userCountry as CountryCode);
    });

    if (matchingOrgs.length === 0) {
      return [];
    }

    // Get all active orgServices for these orgs
    const availableServiceIds: string[] = [];

    for (const org of matchingOrgs) {
      const orgServices = await ctx.db
        .query("orgServices")
        .withIndex("by_org_active", (q) =>
          q.eq("orgId", org._id).eq("isActive", true),
        )
        .take(100);

      for (const os of orgServices) {
        if (!availableServiceIds.includes(os.serviceId)) {
          availableServiceIds.push(os.serviceId);
        }
      }
    }

    return availableServiceIds;
  },
});
