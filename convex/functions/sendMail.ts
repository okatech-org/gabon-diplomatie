/**
 * Send Mail Function
 *
 * Internal messaging system — creates digitalMail records
 * for both sender (in "sent") and recipient (in "inbox").
 * No real email is sent.
 *
 * Supports multi-entity communication:
 *  - Profile → Profile (citizen to citizen)
 *  - Org → Profile (official org to citizen)
 *  - Org → Org (org to org)
 *  - Profile → Org (citizen to org — if allowed)
 */

import { v } from "convex/values";
import { authMutation } from "../lib/customFunctions";
import { internalMutation } from "../_generated/server";
import {
  mailTypeValidator,
  mailOwnerIdValidator,
  mailOwnerTypeValidator,
  mailSenderTypeValidator,
  letterTypeValidator,
  stampColorValidator,
} from "../lib/validators";
import { MailFolder, MailOwnerType, MailSenderType } from "../lib/constants";

/**
 * Derive the MailSenderType from the MailOwnerType.
 */
function senderTypeFromOwnerType(
  ownerType: string,
): (typeof MailSenderType)[keyof typeof MailSenderType] {
  switch (ownerType) {
    case MailOwnerType.Organization:
      return MailSenderType.Organization;
    case MailOwnerType.Association:
      return MailSenderType.Association;
    case MailOwnerType.Company:
      return MailSenderType.Company;
    default:
      return MailSenderType.Citizen;
  }
}

/**
 * Resolve an entity (profile, org, association, or company) to its display name and logo.
 */
async function resolveEntity(
  ctx: any,
  ownerId: string,
  ownerType: string,
): Promise<{ name: string; logoUrl?: string }> {
  if (ownerType === MailOwnerType.Organization) {
    const org = await ctx.db.get(ownerId);
    if (!org) throw new Error("Recipient organization not found");
    return { name: org.name, logoUrl: org.logoUrl };
  }
  if (ownerType === MailOwnerType.Association) {
    const assoc = await ctx.db.get(ownerId);
    if (!assoc) throw new Error("Recipient association not found");
    return { name: assoc.name, logoUrl: assoc.logoUrl };
  }
  if (ownerType === MailOwnerType.Company) {
    const company = await ctx.db.get(ownerId);
    if (!company) throw new Error("Recipient company not found");
    return { name: company.name, logoUrl: company.logoUrl };
  }
  // Profile
  const profile = await ctx.db.get(ownerId);
  if (!profile) throw new Error("Recipient profile not found");
  const user = await ctx.db.get(profile.userId);
  const name =
    `${profile.identity?.firstName ?? ""} ${profile.identity?.lastName ?? ""}`.trim() ||
    user?.name ||
    "Utilisateur";
  return { name };
}

/**
 * Send an internal message (email or letter).
 * Creates a copy in the sender's "sent" folder and the recipient's "inbox".
 */
export const send = authMutation({
  args: {
    // Sender entity (defaults to user's profile if omitted)
    senderOwnerId: v.optional(mailOwnerIdValidator),
    senderOwnerType: v.optional(mailOwnerTypeValidator),
    // Recipient entity
    recipientOwnerId: mailOwnerIdValidator,
    recipientOwnerType: mailOwnerTypeValidator,
    // Content
    type: mailTypeValidator,
    subject: v.string(),
    content: v.string(),
    preview: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          size: v.string(),
          storageId: v.optional(v.id("_storage")),
        }),
      ),
    ),
    // Letter-specific
    letterType: v.optional(letterTypeValidator),
    stampColor: v.optional(stampColorValidator),
    dueDate: v.optional(v.number()),
    // Threading
    threadId: v.optional(v.string()),
    inReplyTo: v.optional(v.id("digitalMail")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Resolve sender
    let senderOwnerId = args.senderOwnerId;
    let senderOwnerType = args.senderOwnerType ?? MailOwnerType.Profile;

    if (!senderOwnerId) {
      // Default to user's profile
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .first();
      if (!profile) throw new Error("Sender profile not found");
      senderOwnerId = profile._id;
      senderOwnerType = MailOwnerType.Profile;
    } else {
      // Verify user has access to the sender entity
      if (senderOwnerType === MailOwnerType.Profile) {
        const profile = await ctx.db.get(senderOwnerId as any);
        if (
          !profile ||
          !("userId" in profile) ||
          profile.userId !== ctx.user._id
        ) {
          throw new Error("Unauthorized: cannot send from this profile");
        }
      } else {
        // Must be a member of the org
        const membership = await ctx.db
          .query("memberships")
          .withIndex("by_user_org", (q) =>
            q.eq("userId", ctx.user._id).eq("orgId", senderOwnerId as any),
          )
          .first();
        if (!membership || membership.deletedAt) {
          throw new Error("Unauthorized: not a member of sender organization");
        }
      }
    }

    // 2. Resolve display info
    const senderInfo = await resolveEntity(ctx, senderOwnerId, senderOwnerType);
    const recipientInfo = await resolveEntity(
      ctx,
      args.recipientOwnerId,
      args.recipientOwnerType,
    );

    const preview =
      args.preview || args.content.substring(0, 120).replace(/\n/g, " ");

    const senderType = senderTypeFromOwnerType(senderOwnerType);

    const baseFields = {
      type: args.type,
      subject: args.subject,
      preview,
      content: args.content,
      attachments: args.attachments,
      isRead: false,
      isStarred: false,
      stampColor: args.stampColor,
      letterType: args.letterType,
      dueDate: args.dueDate,
      threadId: args.threadId || crypto.randomUUID(),
      inReplyTo: args.inReplyTo,
      createdAt: now,
      updatedAt: now,
    };

    const senderObj = {
      name: senderInfo.name,
      type: senderType,
      entityId: senderOwnerId,
      entityType: senderOwnerType,
      logoUrl: senderInfo.logoUrl,
    };

    const recipientObj = {
      name: recipientInfo.name,
      entityId: args.recipientOwnerId,
      entityType: args.recipientOwnerType,
    };

    // 3. Create in recipient's inbox
    const inboxId = await ctx.db.insert("digitalMail", {
      ...baseFields,
      userId: ctx.user._id,
      ownerId: args.recipientOwnerId,
      ownerType: args.recipientOwnerType,
      folder: MailFolder.Inbox,
      sender: senderObj,
      recipient: recipientObj,
    });

    // 4. Create in sender's sent folder (marked as read)
    await ctx.db.insert("digitalMail", {
      ...baseFields,
      userId: ctx.user._id,
      ownerId: senderOwnerId,
      ownerType: senderOwnerType,
      folder: MailFolder.Sent,
      isRead: true,
      sender: senderObj,
      recipient: recipientObj,
    });

    // 5. Backfill threadId on the original message (and its sibling copy)
    //    when replying to a message that was sent before threading existed.
    if (args.inReplyTo && baseFields.threadId) {
      const original = await ctx.db.get(args.inReplyTo);
      if (original && !original.threadId) {
        await ctx.db.patch(args.inReplyTo, {
          threadId: baseFields.threadId,
          updatedAt: now,
        });
        // Also patch the sibling copy (same subject + createdAt, different owner)
        const siblings = await ctx.db
          .query("digitalMail")
          .withIndex("by_user", (q) => q.eq("userId", original.userId))
          .collect();
        for (const sib of siblings) {
          if (
            sib._id !== original._id &&
            sib.createdAt === original.createdAt &&
            sib.subject === original.subject &&
            !sib.threadId
          ) {
            await ctx.db.patch(sib._id, {
              threadId: baseFields.threadId,
              updatedAt: now,
            });
          }
        }
      }
    }

    return inboxId;
  },
});

/**
 * System send — for admin/system messages to entities.
 * Only creates in the recipient's inbox (no sender copy).
 */
export const systemSend = internalMutation({
  args: {
    recipientOwnerId: mailOwnerIdValidator,
    recipientOwnerType: mailOwnerTypeValidator,
    type: mailTypeValidator,
    subject: v.string(),
    content: v.string(),
    preview: v.optional(v.string()),
    senderName: v.string(),
    senderType: v.optional(mailSenderTypeValidator),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          size: v.string(),
          storageId: v.optional(v.id("_storage")),
        }),
      ),
    ),
    // Letter-specific
    letterType: v.optional(letterTypeValidator),
    stampColor: v.optional(stampColorValidator),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const preview =
      args.preview || args.content.substring(0, 120).replace(/\n/g, " ");

    // For system mails, we need a userId. Use the first admin or create with a sentinel.
    // Since this is internalMutation, we use a system sender entityId pointing to the recipient
    // (the system doesn't have a "profile" per se — we use the recipient as context).
    return await ctx.db.insert("digitalMail", {
      userId: args.recipientOwnerId as any, // System — no real author
      ownerId: args.recipientOwnerId,
      ownerType: args.recipientOwnerType,
      type: args.type,
      folder: MailFolder.Inbox,
      sender: {
        name: args.senderName,
        type: args.senderType || MailSenderType.System,
        entityId: args.recipientOwnerId, // System sender — no real entity
        entityType: args.recipientOwnerType,
      },
      subject: args.subject,
      preview,
      content: args.content,
      attachments: args.attachments,
      isRead: false,
      isStarred: false,
      stampColor: args.stampColor,
      letterType: args.letterType,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});
