import { v } from "convex/values";
import { defineTable } from "convex/server";

export const signauxTable = defineTable({
  type: v.string(), // Extracted from SIGNAL_TYPES
  source: v.string(), // Component or function name
  destination: v.optional(v.string()), // Target cortex, if broadcast it's undefined
  entiteType: v.optional(v.string()), // Optional entity type (e.g. "users", "requests")
  entiteId: v.optional(v.string()), // Optional related entity ID
  payload: v.any(), // The actual data of the signal
  confiance: v.number(), // 0 to 1
  priorite: v.union(
    v.literal("LOW"),
    v.literal("NORMAL"),
    v.literal("HIGH"),
    v.literal("CRITICAL")
  ),
  correlationId: v.string(), // GUID for tracking chains
  parentSignalId: v.optional(v.id("signaux")), // Chaining
  ttl: v.optional(v.number()), // Time to live in ms
  traite: v.boolean(),
  timestamp: v.number(),
})
  .index("by_type", ["type"])
  .index("by_timestamp", ["timestamp"])
  .index("by_non_traite", ["traite", "timestamp"])
  .index("by_correlation", ["correlationId"]);

export const historiqueActionsTable = defineTable({
  action: v.string(), // E.g., "CREATE_USER"
  categorie: v.string(), // METIER, SYSTEME, UTILISATEUR, SECURITE
  entiteType: v.string(), // "users", "requests" etc.
  entiteId: v.string(),
  userId: v.optional(v.string()), // User who performed the action (if known)
  details: v.object({
    avant: v.any(),
    apres: v.any(),
  }),
  metadata: v.optional(v.any()),
  timestamp: v.number(),
})
  .index("by_entite", ["entiteType", "entiteId"])
  .index("by_user", ["userId", "timestamp"])
  .index("by_timestamp", ["timestamp"])
  .index("by_categorie", ["categorie", "timestamp"]);

export const configSystemeTable = defineTable({
  cle: v.string(),
  valeur: v.any(),
  description: v.optional(v.string()),
  modifiePar: v.optional(v.string()),
  timestamp: v.number(),
}).index("by_cle", ["cle"]);

export const metriquesTable = defineTable({
  nom: v.string(),
  valeur: v.number(),
  unite: v.string(),
  periode: v.string(), // e.g., "1h", "1d"
  dimensions: v.optional(v.any()), // Extra labels (e.g. { cortex: "limbique" })
  timestamp: v.number(),
})
  .index("by_nom", ["nom", "timestamp"])
  .index("by_periode", ["periode", "timestamp"]);

export const poidsAdaptatifsTable = defineTable({
  signal: v.string(), // Type de signal
  regle: v.string(), // Identifiant de la règle
  poids: v.number(), // 0 to 1
  executionsReussies: v.number(),
  executionsEchouees: v.number(),
  dernierAjustement: v.number(),
}).index("by_signal", ["signal", "regle"]);
