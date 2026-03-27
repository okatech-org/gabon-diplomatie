import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ============================================================================
// CORTEX MOTEUR — Exécution d'actions externes (effets de bord)
//
// Reçoit les dispatches du limbique et exécute via les services existants :
// - Email → Resend (via functions/notifications)
// - SMS → Bird (via functions/smsNotifications)
// - Notification in-app → createNotificationRecord
// ============================================================================

/**
 * Point d'entrée unique pour toute action externe déclenchée par le NEOCORTEX.
 * Le limbique route ici les signaux qui nécessitent un effet de bord.
 */
export const executerActionExterne = internalAction({
  args: {
    actionType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const { actionType, payload } = args;

    switch (actionType) {
      case "SEND_EMAIL": {
        // Dispatcher vers le système d'email Resend existant
        if (payload.to && payload.template && payload.data) {
          await ctx.runAction(
            internal.functions.notifications.sendNotificationEmail,
            {
              to: payload.to,
              template: payload.template,
              data: payload.data,
            },
          );
        }
        break;
      }

      case "SEND_SMS": {
        // Dispatcher vers Bird SMS existant
        if (payload.phone && payload.template && payload.data) {
          await ctx.runAction(
            internal.functions.smsNotifications.sendSmsNotification,
            {
              phone: payload.phone,
              template: payload.template,
              data: payload.data,
            },
          );
        }
        break;
      }

      case "CREATE_NOTIFICATION": {
        // Créer une notification in-app directement
        if (payload.userId && payload.title && payload.body) {
          await ctx.runMutation(
            internal.moteur.createNotificationRecord,
            {
              userId: payload.userId,
              title: payload.title,
              body: payload.body,
              type: payload.type ?? "updated",
              link: payload.link,
              relatedId: payload.relatedId,
              relatedType: payload.relatedType,
            },
          );
        }
        break;
      }

      default:
        break;
    }
  },
});

/**
 * Mutation interne pour insérer une notification in-app.
 * Séparée car les actions ne peuvent pas écrire directement en DB.
 */
export const createNotificationRecord = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId as any,
      title: args.title,
      body: args.body,
      type: args.type as any,
      isRead: false,
      link: args.link,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      createdAt: Date.now(),
    });
  },
});
