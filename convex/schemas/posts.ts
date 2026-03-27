import { defineTable } from "convex/server";
import { v } from "convex/values";
import { postCategoryValidator, postStatusValidator } from "../lib/validators";

/**
 * Posts table - Actualités, Événements, Communiqués
 * 
 * Champs spécifiques par catégorie :
 * - news: titre, contenu, image (basique)
 * - event: + date début/fin, lieu, billetterie
 * - communique: + document PDF officiel (obligatoire)
 */
export const postsTable = defineTable({
  // === Champs communs ===
  title: v.string(),
  slug: v.string(),
  excerpt: v.string(),
  content: v.string(), // HTML from Tiptap editor
  coverImageStorageId: v.optional(v.id("_storage")),
  
  category: postCategoryValidator,
  status: postStatusValidator,
  
  // Publication
  publishedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  
  // Relations
  orgId: v.optional(v.id("orgs")), // null = global post (superadmin)
  authorId: v.id("users"),
  
  // === Champs ÉVÉNEMENT ===
  eventStartAt: v.optional(v.number()),
  eventEndAt: v.optional(v.number()),
  eventLocation: v.optional(v.string()),
  eventTicketUrl: v.optional(v.string()),
  
  // === Champs COMMUNIQUÉ ===
  documentStorageId: v.optional(v.id("_storage")), // PDF officiel
})
  .index("by_slug", ["slug"])
  .index("by_category", ["category"])
  .index("by_status", ["status"])
  .index("by_org", ["orgId"])
  .index("by_published", ["status", "publishedAt"])
  .index("by_org_status", ["orgId", "status"]);
