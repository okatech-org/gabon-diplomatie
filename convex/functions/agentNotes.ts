import { v } from "convex/values";
import { authQuery, authMutation } from "../lib/customFunctions";
import { getMembership } from "../lib/auth";
import { assertCanDoTask } from "../lib/permissions";
import { error, ErrorCode } from "../lib/errors";

/**
 * List agent notes for a request (agent only)
 */
export const listByRequest = authQuery({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw error(ErrorCode.REQUEST_NOT_FOUND);
    }

    const membership = await getMembership(ctx, ctx.user._id, request.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "requests.process");

    const notes = await ctx.db
      .query("agentNotes")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .order("desc")
      .collect();

    // Enrich with author info
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        let author = null;
        if (note.authorId) {
          const user = await ctx.db.get(note.authorId);
          if (user) {
            author = {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
            };
          }
        }
        return {
          ...note,
          author,
        };
      })
    );

    return enrichedNotes;
  },
});

/**
 * Add a note to a request (agent only)
 */
export const create = authMutation({
  args: {
    requestId: v.id("requests"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw error(ErrorCode.REQUEST_NOT_FOUND);
    }

    const membership = await getMembership(ctx, ctx.user._id, request.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "requests.process");

    const noteId = await ctx.db.insert("agentNotes", {
      requestId: args.requestId,
      authorId: ctx.user._id,
      content: args.content,
      source: "agent",
      createdAt: Date.now(),
    });

    return noteId;
  },
});

/**
 * Delete a note (agent only, own notes only)
 */
export const remove = authMutation({
  args: {
    noteId: v.id("agentNotes"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw error(ErrorCode.NOT_FOUND);
    }

    const request = await ctx.db.get(note.requestId);
    if (!request) {
      throw error(ErrorCode.REQUEST_NOT_FOUND);
    }

    const membership = await getMembership(ctx, ctx.user._id, request.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "requests.process");

    // Only allow deleting own notes (not AI notes)
    if (note.source !== "agent" || note.authorId !== ctx.user._id) {
      throw error(ErrorCode.INSUFFICIENT_PERMISSIONS);
    }

    await ctx.db.delete(args.noteId);

    return args.noteId;
  },
});
