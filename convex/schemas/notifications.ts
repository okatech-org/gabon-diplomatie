/**
 * In-App Notifications Schema
 * 
 * Stores notifications for users to view in the app.
 * Works alongside email notifications.
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";
import { notificationTypeValidator } from "../lib/validators";

export const notificationsTable = defineTable({
  // Recipient
  userId: v.id("users"),
  
  // Notification content
  type: notificationTypeValidator,
  title: v.string(),
  body: v.string(),
  
  // Deep link (e.g., /my-space/requests/xxx)
  link: v.optional(v.string()),
  
  // Read status
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  
  // Related entity
  relatedId: v.optional(v.string()),
  relatedType: v.optional(v.string()), // "request", "appointment", "document"
  
  // Metadata
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_unread", ["userId", "isRead"])
  .index("by_user_created", ["userId", "createdAt"]);
