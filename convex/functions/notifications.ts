import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { components } from "../_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { authQuery, authMutation } from "../lib/customFunctions";
import { notificationTypeValidator } from "../lib/validators";

// Initialize Resend with test mode off for production
export const resend = new Resend(components.resend, {
  testMode: process.env.NODE_ENV !== "production" ? true : false,
});

// Email sender address — configurable via RESEND_FROM_EMAIL env var
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ??
  "Consulat du Gabon <mail@updates.consulat.ga>";

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const getBaseStyles = () => `
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #009639 0%, #006b2b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
		.header h1 { margin: 0; font-size: 24px; }
		.content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
		.footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
		.button { display: inline-block; background: #009639; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
		.info-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 15px; margin: 15px 0; }
		.warning-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 15px 0; }
	</style>
`;

const emailLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	${getBaseStyles()}
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🇬🇦 Consulat du Gabon</h1>
			<p style="margin: 5px 0 0 0; opacity: 0.9;">${title}</p>
		</div>
		<div class="content">
			${content}
		</div>
		<div class="footer">
			<p>Consulat Général du Gabon en France</p>
			<p>Ce message a été envoyé automatiquement, merci de ne pas répondre.</p>
		</div>
	</div>
</body>
</html>
`;

// ============================================================================
// EMAIL TEMPLATES CONTENT
// ============================================================================

export const emailTemplates = {
  // New message notification
  newMessage: (data: {
    userName: string;
    requestRef: string;
    senderName: string;
    messagePreview: string;
    requestUrl: string;
  }) => ({
    subject: `Nouveau message - Demande ${data.requestRef}`,
    html: emailLayout(
      "Nouveau Message",
      `
			<p>Bonjour ${data.userName},</p>
			<p>Vous avez reçu un nouveau message concernant votre demande <strong>${data.requestRef}</strong>.</p>
			<div class="info-box">
				<p><strong>De :</strong> ${data.senderName}</p>
				<p style="margin: 0;">${data.messagePreview}</p>
			</div>
			<p style="text-align: center; margin-top: 25px;">
				<a href="${data.requestUrl}" class="button">Voir la conversation</a>
			</p>
		`,
    ),
  }),

  // Request status update
  statusUpdate: (data: {
    userName: string;
    requestRef: string;
    serviceName: string;
    newStatus: string;
    statusLabel: string;
    requestUrl: string;
  }) => ({
    subject: `Mise à jour - Demande ${data.requestRef}`,
    html: emailLayout(
      "Mise à jour de votre demande",
      `
			<p>Bonjour ${data.userName},</p>
			<p>Le statut de votre demande <strong>${data.requestRef}</strong> a été mis à jour.</p>
			<div class="info-box">
				<p><strong>Service :</strong> ${data.serviceName}</p>
				<p><strong>Nouveau statut :</strong> ${data.statusLabel}</p>
			</div>
			<p style="text-align: center; margin-top: 25px;">
				<a href="${data.requestUrl}" class="button">Voir ma demande</a>
			</p>
		`,
    ),
  }),

  // Appointment reminder
  appointmentReminder: (data: {
    userName: string;
    requestRef: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    address: string;
  }) => ({
    subject: `Rappel RDV - ${data.appointmentDate}`,
    html: emailLayout(
      "Rappel de Rendez-vous",
      `
			<p>Bonjour ${data.userName},</p>
			<p>Ceci est un rappel pour votre rendez-vous de demain.</p>
			<div class="warning-box">
				<p><strong>📅 Date :</strong> ${data.appointmentDate}</p>
				<p><strong>🕐 Heure :</strong> ${data.appointmentTime}</p>
				<p><strong>📍 Lieu :</strong> ${data.address}</p>
				<p><strong>📋 Service :</strong> ${data.serviceName}</p>
			</div>
			<p><strong>Documents à apporter :</strong></p>
			<ul>
				<li>Pièce d'identité valide</li>
				<li>Tous les documents demandés pour votre dossier</li>
			</ul>
			<p style="font-size: 14px; color: #6b7280;">
				En cas d'empêchement, veuillez nous contacter dès que possible.
			</p>
		`,
    ),
  }),

  // Payment confirmation
  paymentConfirmation: (data: {
    userName: string;
    requestRef: string;
    serviceName: string;
    amount: string;
    currency: string;
    requestUrl: string;
  }) => ({
    subject: `Paiement confirmé - ${data.requestRef}`,
    html: emailLayout(
      "Paiement Confirmé",
      `
			<p>Bonjour ${data.userName},</p>
			<p>Votre paiement a été reçu et confirmé. Merci !</p>
			<div class="info-box">
				<p><strong>Demande :</strong> ${data.requestRef}</p>
				<p><strong>Service :</strong> ${data.serviceName}</p>
				<p><strong>Montant :</strong> ${data.amount} ${data.currency}</p>
			</div>
			<p style="text-align: center; margin-top: 25px;">
				<a href="${data.requestUrl}" class="button">Voir ma demande</a>
			</p>
		`,
    ),
  }),

  // Action required
  actionRequired: (data: {
    userName: string;
    requestRef: string;
    actionMessage: string;
    deadline?: string;
    requestUrl: string;
  }) => ({
    subject: `⚠️ Action requise - ${data.requestRef}`,
    html: emailLayout(
      "Action Requise",
      `
			<p>Bonjour ${data.userName},</p>
			<p>Une action de votre part est nécessaire pour la demande <strong>${data.requestRef}</strong>.</p>
			<div class="warning-box">
				<p><strong>Action demandée :</strong></p>
				<p>${data.actionMessage}</p>
				${data.deadline ? `<p><strong>⏰ Délai :</strong> ${data.deadline}</p>` : ""}
			</div>
			<p style="text-align: center; margin-top: 25px;">
				<a href="${data.requestUrl}" class="button">Compléter ma demande</a>
			</p>
		`,
    ),
  }),

  // Request completed
  requestCompleted: (data: {
    userName: string;
    requestRef: string;
    serviceName: string;
    requestUrl: string;
  }) => ({
    subject: `✅ Demande traitée - ${data.requestRef}`,
    html: emailLayout(
      "Demande Traitée",
      `
			<p>Bonjour ${data.userName},</p>
			<p>Bonne nouvelle ! Votre demande <strong>${data.requestRef}</strong> a été traitée avec succès.</p>
			<div class="info-box">
				<p><strong>Service :</strong> ${data.serviceName}</p>
				<p><strong>Statut :</strong> ✅ Terminé</p>
			</div>
			<p>Vous pouvez consulter votre demande et télécharger les documents disponibles.</p>
			<p style="text-align: center; margin-top: 25px;">
				<a href="${data.requestUrl}" class="button">Voir ma demande</a>
			</p>
		`,
    ),
  }),
};

// ============================================================================
// SEND EMAIL ACTIONS
// ============================================================================

export const sendNotificationEmail = internalAction({
  args: {
    to: v.string(),
    template: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const templateFn =
      emailTemplates[args.template as keyof typeof emailTemplates];
    if (!templateFn) {
      console.error("Unknown email template:", args.template);
      return { success: false, error: "Unknown template" };
    }

    const email = templateFn(args.data);

    try {
      await resend.sendEmail(ctx, {
        from: FROM_EMAIL,
        to: args.to,
        subject: email.subject,
        html: email.html,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  },
});

// ============================================================================
// NOTIFICATION TRIGGERS
// ============================================================================

/**
 * Send notification for new message
 */
export const notifyNewMessage = internalMutation({
  args: {
    requestId: v.id("requests"),
    senderId: v.id("users"),
    messagePreview: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;

    const user = await ctx.db.get(request.userId);
    const sender = await ctx.db.get(args.senderId);
    if (!user?.email) return;

    // Don't notify if sender is the recipient
    if (args.senderId === request.userId) return;

    const appUrl = process.env.APP_URL || "https://consulat.ga";
    const userName = user.name || "Cher(e) usager";
    const senderName = sender?.name || "Agent consulaire";

    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.sendNotificationEmail,
      {
        to: user.email,
        template: "newMessage",
        data: {
          userName,
          requestRef: request.reference,
          senderName,
          messagePreview: args.messagePreview.substring(0, 200),
          requestUrl: `${appUrl}/my-space/requests/${request.reference}`,
        },
      },
    );


  },
});

/**
 * Send notification for status update
 */
export const notifyStatusUpdate = internalMutation({
  args: {
    requestId: v.id("requests"),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;

    const user = await ctx.db.get(request.userId);
    if (!user?.email) return;

    const orgService = await ctx.db.get(request.orgServiceId);
    const service = orgService ? await ctx.db.get(orgService.serviceId) : null;
    const serviceName =
      service?.name ?
        typeof service.name === "object" ?
          service.name.fr
        : service.name
      : "Service";

    const statusLabels: Record<string, string> = {
      pending: "En attente",
      processing: "En traitement",
      completed: "Terminé",
      cancelled: "Annulé",
    };

    const appUrl = process.env.APP_URL || "https://consulat.ga";
    const userName = user.name || "Cher(e) usager";
    const statusLabel = statusLabels[args.newStatus] || args.newStatus;

    // Use specific template for completed requests
    const template =
      args.newStatus === "completed" ? "requestCompleted" : "statusUpdate";

    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.sendNotificationEmail,
      {
        to: user.email,
        template,
        data: {
          userName,
          requestRef: request.reference,
          serviceName,
          newStatus: args.newStatus,
          statusLabel,
          requestUrl: `${appUrl}/my-space/requests/${request.reference}`,
        },
      },
    );


  },
});

/**
 * Send payment confirmation
 */
export const notifyPaymentSuccess = internalMutation({
  args: {
    requestId: v.id("requests"),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;

    const user = await ctx.db.get(request.userId);
    if (!user?.email) return;

    const orgService = await ctx.db.get(request.orgServiceId);
    const service = orgService ? await ctx.db.get(orgService.serviceId) : null;
    const serviceName =
      service?.name ?
        typeof service.name === "object" ?
          service.name.fr
        : service.name
      : "Service";

    const appUrl = process.env.APP_URL || "https://consulat.ga";
    const userName = user.name || "Cher(e) usager";
    const amount = `${(args.amount / 100).toFixed(2)} ${args.currency.toUpperCase()}`;

    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.sendNotificationEmail,
      {
        to: user.email,
        template: "paymentConfirmation",
        data: {
          userName,
          requestRef: request.reference,
          serviceName,
          amount: (args.amount / 100).toFixed(2),
          currency: args.currency.toUpperCase(),
          requestUrl: `${appUrl}/my-space/requests/${request.reference}`,
        },
      },
    );


  },
});

/**
 * Send action required notification
 */
export const notifyActionRequired = internalMutation({
  args: {
    requestId: v.id("requests"),
    message: v.string(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;

    const user = await ctx.db.get(request.userId);
    if (!user?.email) return;

    const appUrl = process.env.APP_URL || "https://consulat.ga";
    const userName = user.name || "Cher(e) usager";

    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.sendNotificationEmail,
      {
        to: user.email,
        template: "actionRequired",
        data: {
          userName,
          requestRef: request.reference,
          actionMessage: args.message,
          deadline:
            args.deadline ?
              new Date(args.deadline).toLocaleDateString("fr-FR")
            : undefined,
          requestUrl: `${appUrl}/my-space/requests/${request.reference}`,
        },
      },
    );

    // SMS via Bird (action requise = SMS important)
    if (user.phone && user.preferences?.smsNotifications !== false) {
      await ctx.scheduler.runAfter(
        0,
        internal.functions.smsNotifications.sendSmsNotification,
        {
          phone: user.phone,
          template: "action_required" as const,
          data: {
            userName,
            requestRef: request.reference,
            actionMessage: args.message,
          },
        },
      );
    }
  },
});

// ============================================================================
// CRON JOB HANDLERS
// ============================================================================

/**
 * Send appointment reminders for tomorrow's appointments
 * Called daily by cron job
 */
export const sendAppointmentReminders = internalMutation({
  handler: async (ctx) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    // Get all appointments scheduled for tomorrow from the appointments table
    const appointments = await ctx.db
      .query("appointments")
      .filter((q) =>
        q.and(
          q.eq(q.field("date"), tomorrowStr),
          q.neq(q.field("status"), "cancelled"),
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "no_show"),
        ),
      )
      .take(500);

    let sentCount = 0;

    for (const appointment of appointments) {
      // Get request linked to this appointment (if any)
      const request = appointment.requestId
        ? await ctx.db.get(appointment.requestId)
        : null;

      // Get attendee's user info via their profile
      const profile = await ctx.db.get(appointment.attendeeProfileId);
      if (!profile) continue;
      const user = await ctx.db.get(profile.userId);
      if (!user?.email) continue;

      const orgService = appointment.orgServiceId
        ? await ctx.db.get(appointment.orgServiceId)
        : null;
      const service =
        orgService ? await ctx.db.get(orgService.serviceId) : null;
      const org = await ctx.db.get(appointment.orgId);

      const serviceName =
        service?.name ?
          typeof service.name === "object" ?
            service.name.fr
          : service.name
        : "Service";

      const userName = user.name || "Cher(e) usager";
      const appointmentDate = tomorrow.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const address = org?.address || "Consulat Général du Gabon";

      await ctx.scheduler.runAfter(
        0,
        internal.functions.notifications.sendNotificationEmail,
        {
          to: user.email,
          template: "appointmentReminder",
          data: {
            userName,
            requestRef: request?.reference || "-",
            serviceName,
            appointmentDate,
            appointmentTime: appointment.time,
            address,
          },
        },
      );

      // SMS via Bird (rappel RDV = SMS important)
      if (user.phone && user.preferences?.smsNotifications !== false) {
        await ctx.scheduler.runAfter(
          0,
          internal.functions.smsNotifications.sendSmsNotification,
          {
            phone: user.phone,
            template: "appointment_reminder" as const,
            data: {
              userName,
              appointmentDate,
              appointmentTime: appointment.time,
              address,
            },
          },
        );
      }

      sentCount++;
    }

    console.log(`Sent ${sentCount} appointment reminders`);
    return { sentCount };
  },
});

// ============================================================================
// IN-APP NOTIFICATIONS QUERIES & MUTATIONS
// ============================================================================

/**
 * List user notifications with pagination
 */
export const list = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = authQuery({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", ctx.user._id).eq("isRead", false),
      )
      .take(200);

    return unread.length;
  },
});

/**
 * Mark a single notification as read
 */
export const markAsRead = authMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== ctx.user._id) {
      return { success: false };
    }

    if (!notification.isRead) {
      await ctx.db.patch(args.notificationId, {
        isRead: true,
        readAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = authMutation({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", ctx.user._id).eq("isRead", false),
      )
      .take(200);

    const now = Date.now();
    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true, readAt: now })),
    );

    return { count: unread.length };
  },
});

/**
 * Create an in-app notification (internal use)
 */
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
