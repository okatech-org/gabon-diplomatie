import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const creerNotification = mutation({
  args: {
    userId: v.string(), // The recipient
    titre: v.string(),
    message: v.string(),
    type: v.string(), // EMAIL, SMS, IN_APP
    lien: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // A concrete implementation would insert into a users' notifications table
    // For now we just emit a signal for processing
    await ctx.scheduler.runAfter(0, internal.limbique.emettreSignal, {
      type: "NOUVELLE_NOTIFICATION",
      source: "AUDITIF",
      destination: "MOTEUR", // Let the motor cortex send the email/SMS
      payload: args,
      confiance: 1,
      priorite: "NORMAL",
      correlationId: crypto.randomUUID(),
    });

    return true;
  },
});

export const marquerLue = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// Assuming a standard 'notifications' table exists from the legacy schemas
// If it doesn't match perfectly, it should be adapted. 
export const listerNonLues = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();
  },
});
