import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { PostStatus } from "../lib/constants";
import {
  tutorialCategoryValidator,
  tutorialTypeValidator,
  postStatusValidator,
} from "../lib/validators";
import { requireBackOfficeAccess } from "../lib/auth";
import { error, ErrorCode } from "../lib/errors";

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * List published tutorials with optional category filter
 */
export const list = query({
  args: {
    category: v.optional(tutorialCategoryValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let tutorials;
    if (args.category) {
      tutorials = await ctx.db
        .query("tutorials")
        .withIndex("by_category_status", (q) => q.eq("category", args.category!).eq("status", PostStatus.Published))
        .collect();
      // Sort by publishedAt desc and limit
      tutorials = tutorials
        .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
        .slice(0, limit);
    } else {
      tutorials = await ctx.db
        .query("tutorials")
        .withIndex("by_published", (q) => q.eq("status", PostStatus.Published))
        .order("desc")
        .take(limit);
    }

    // Resolve cover images
    return Promise.all(
      tutorials.map(async (tutorial) => {
        let coverImageUrl: string | null = null;
        if (tutorial.coverImageStorageId) {
          coverImageUrl = await ctx.storage.getUrl(
            tutorial.coverImageStorageId,
          );
        }
        return { ...tutorial, coverImageUrl };
      }),
    );
  },
});

/**
 * Get a single tutorial by slug (public)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const tutorial = await ctx.db
      .query("tutorials")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!tutorial || tutorial.status !== "published") {
      return null;
    }

    let coverImageUrl: string | null = null;
    if (tutorial.coverImageStorageId) {
      coverImageUrl = await ctx.storage.getUrl(tutorial.coverImageStorageId);
    }

    // Get author info
    const author = await ctx.db.get(tutorial.authorId);

    return {
      ...tutorial,
      coverImageUrl,
      authorName: author?.name ?? "Inconnu",
    };
  },
});

// ============================================================================
// SUPERADMIN QUERIES
// ============================================================================

/**
 * List all tutorials (superadmin only)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireBackOfficeAccess(ctx);
    const tutorials = await ctx.db.query("tutorials").order("desc").take(200);

    return Promise.all(
      tutorials.map(async (tutorial) => {
        const coverImageUrl =
          tutorial.coverImageStorageId ?
            await ctx.storage.getUrl(tutorial.coverImageStorageId)
          : null;
        const author = await ctx.db.get(tutorial.authorId);

        return {
          ...tutorial,
          coverImageUrl,
          authorName: author?.name ?? "Inconnu",
        };
      }),
    );
  },
});

/**
 * Get a single tutorial by ID (for editing)
 */
export const getById = query({
  args: { tutorialId: v.id("tutorials") },
  handler: async (ctx, args) => {
    const tutorial = await ctx.db.get(args.tutorialId);
    if (!tutorial) return null;

    const coverImageUrl =
      tutorial.coverImageStorageId ?
        await ctx.storage.getUrl(tutorial.coverImageStorageId)
      : null;

    return { ...tutorial, coverImageUrl };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new tutorial
 */
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    category: tutorialCategoryValidator,
    type: tutorialTypeValidator,
    duration: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    publish: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireBackOfficeAccess(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("tutorials")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw error(
        ErrorCode.TUTORIAL_SLUG_EXISTS,
        "Un tutoriel avec ce slug existe déjà",
      );
    }

    const now = Date.now();
    const status = args.publish ? PostStatus.Published : PostStatus.Draft;

    const tutorialId = await ctx.db.insert("tutorials", {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      category: args.category,
      type: args.type,
      duration: args.duration,
      videoUrl: args.videoUrl,
      coverImageStorageId: args.coverImageStorageId,
      status,
      publishedAt: args.publish ? now : undefined,
      createdAt: now,
      authorId: user._id,
    });

    return tutorialId;
  },
});

/**
 * Update an existing tutorial
 */
export const update = mutation({
  args: {
    tutorialId: v.id("tutorials"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(tutorialCategoryValidator),
    type: v.optional(tutorialTypeValidator),
    duration: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    const tutorial = await ctx.db.get(args.tutorialId);
    if (!tutorial) {
      throw error(ErrorCode.TUTORIAL_NOT_FOUND, "Tutoriel non trouvé");
    }

    // If slug is changing, check uniqueness
    if (args.slug && args.slug !== tutorial.slug) {
      const existing = await ctx.db
        .query("tutorials")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (existing) {
        throw error(
          ErrorCode.TUTORIAL_SLUG_EXISTS,
          "Un tutoriel avec ce slug existe déjà",
        );
      }
    }

    const { tutorialId, ...updates } = args;

    await ctx.db.patch(tutorialId, {
      ...updates,
    });

    return tutorialId;
  },
});

/**
 * Publish or unpublish a tutorial
 */
export const setStatus = mutation({
  args: {
    tutorialId: v.id("tutorials"),
    status: postStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    const tutorial = await ctx.db.get(args.tutorialId);
    if (!tutorial) {
      throw error(ErrorCode.TUTORIAL_NOT_FOUND, "Tutoriel non trouvé");
    }

    await ctx.db.patch(args.tutorialId, {
      status: args.status,
      publishedAt:
        args.status === PostStatus.Published ?
          Date.now()
        : tutorial.publishedAt,
    });

    return args.tutorialId;
  },
});

/**
 * Delete a tutorial
 */
export const remove = mutation({
  args: { tutorialId: v.id("tutorials") },
  handler: async (ctx, args) => {
    await requireBackOfficeAccess(ctx);

    const tutorial = await ctx.db.get(args.tutorialId);
    if (!tutorial) {
      throw error(ErrorCode.TUTORIAL_NOT_FOUND, "Tutoriel non trouvé");
    }

    // Delete associated files
    if (tutorial.coverImageStorageId) {
      await ctx.storage.delete(tutorial.coverImageStorageId);
    }

    await ctx.db.delete(args.tutorialId);

    return args.tutorialId;
  },
});
