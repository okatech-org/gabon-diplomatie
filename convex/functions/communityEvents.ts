import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { PostStatus } from "../lib/constants";
import { postStatusValidator } from "../lib/validators";
import { requireBackOfficeAccess } from "../lib/auth";
import { error, ErrorCode } from "../lib/errors";

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * List published community events, sorted by date descending
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const paginatedResult = await ctx.db
      .query("communityEvents")
      .withIndex("by_date", (q) => q.eq("status", PostStatus.Published))
      .order("desc")
      .paginate(args.paginationOpts);

    // Resolve cover images for current page
    const page = await Promise.all(
      paginatedResult.page.map(async (event) => {
        let coverImageUrl: string | null = null;
        if (event.coverImageStorageId) {
          coverImageUrl = await ctx.storage.getUrl(event.coverImageStorageId);
        }
        return { ...event, coverImageUrl };
      }),
    );

    return {
      ...paginatedResult,
      page,
    };
  },
});

/**
 * List upcoming community events (date > now)
 */
export const listUpcoming = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const now = Date.now();

    const upcoming = await ctx.db
      .query("communityEvents")
      .withIndex("by_date", (q) => q.eq("status", PostStatus.Published).gt("date", now))
      .order("asc")
      .take(limit);

    return Promise.all(
      upcoming.map(async (event) => {
        let coverImageUrl: string | null = null;
        if (event.coverImageStorageId) {
          coverImageUrl = await ctx.storage.getUrl(event.coverImageStorageId);
        }
        return { ...event, coverImageUrl };
      }),
    );
  },
});

/**
 * Get a single community event by slug (public)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("communityEvents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!event || event.status !== "published") {
      return null;
    }

    let coverImageUrl: string | null = null;
    if (event.coverImageStorageId) {
      coverImageUrl = await ctx.storage.getUrl(event.coverImageStorageId);
    }

    // Resolve gallery images
    const galleryImageUrls: string[] = [];
    if (event.galleryImageStorageIds) {
      for (const id of event.galleryImageStorageIds) {
        const url = await ctx.storage.getUrl(id);
        if (url) galleryImageUrls.push(url);
      }
    }

    return { ...event, coverImageUrl, galleryImageUrls };
  },
});

// ============================================================================
// SUPERADMIN QUERIES
// ============================================================================

/**
 * List all community events (superadmin only)
 */
export const listAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);
    const paginatedResult = await ctx.db
      .query("communityEvents")
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      paginatedResult.page.map(async (event) => {
        const coverImageUrl =
          event.coverImageStorageId ?
            await ctx.storage.getUrl(event.coverImageStorageId)
          : null;

        const org = event.orgId ? await ctx.db.get(event.orgId) : null;

        return {
          ...event,
          coverImageUrl,
          orgName: org?.name ?? "Global",
        };
      }),
    );

    return {
      ...paginatedResult,
      page,
    };
  },
});

/**
 * Get a single event by ID (for editing)
 */
export const getById = query({
  args: { eventId: v.id("communityEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const coverImageUrl =
      event.coverImageStorageId ?
        await ctx.storage.getUrl(event.coverImageStorageId)
      : null;

    return { ...event, coverImageUrl };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new community event
 */
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    location: v.string(),
    category: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    galleryImageStorageIds: v.optional(v.array(v.id("_storage"))),
    orgId: v.optional(v.id("orgs")),
    publish: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("communityEvents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw error(
        ErrorCode.EVENT_SLUG_EXISTS,
        "Un événement avec ce slug existe déjà",
      );
    }

    const now = Date.now();
    const status = args.publish ? PostStatus.Published : PostStatus.Draft;

    const eventId = await ctx.db.insert("communityEvents", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      date: args.date,
      location: args.location,
      category: args.category,
      coverImageStorageId: args.coverImageStorageId,
      galleryImageStorageIds: args.galleryImageStorageIds,
      orgId: args.orgId,
      status,
      createdAt: now,
    });

    return eventId;
  },
});

/**
 * Update an existing community event
 */
export const update = mutation({
  args: {
    eventId: v.id("communityEvents"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    galleryImageStorageIds: v.optional(v.array(v.id("_storage"))),
    orgId: v.optional(v.id("orgs")),
  },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw error(ErrorCode.EVENT_NOT_FOUND, "Événement non trouvé");
    }

    // If slug is changing, check uniqueness
    if (args.slug && args.slug !== event.slug) {
      const existing = await ctx.db
        .query("communityEvents")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (existing) {
        throw error(
          ErrorCode.EVENT_SLUG_EXISTS,
          "Un événement avec ce slug existe déjà",
        );
      }
    }

    const { eventId, ...updates } = args;

    await ctx.db.patch(eventId, {
      ...updates,
    });

    return eventId;
  },
});

/**
 * Publish or unpublish a community event
 */
export const setStatus = mutation({
  args: {
    eventId: v.id("communityEvents"),
    status: postStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw error(ErrorCode.EVENT_NOT_FOUND, "Événement non trouvé");
    }

    await ctx.db.patch(args.eventId, {
      status: args.status,
    });

    return args.eventId;
  },
});

/**
 * Delete a community event
 */
export const remove = mutation({
  args: { eventId: v.id("communityEvents") },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw error(ErrorCode.EVENT_NOT_FOUND, "Événement non trouvé");
    }

    // Delete associated files
    if (event.coverImageStorageId) {
      await ctx.storage.delete(event.coverImageStorageId);
    }
    if (event.galleryImageStorageIds) {
      for (const id of event.galleryImageStorageIds) {
        await ctx.storage.delete(id);
      }
    }

    await ctx.db.delete(args.eventId);

    return args.eventId;
  },
});
