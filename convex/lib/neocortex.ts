import { internal } from "../_generated/api";
import type { LogCortexParams } from "./types";

/**
 * Interface minimale pour le contexte de mutation.
 * Compatible avec authMutation, mutation, internalMutation, etc.
 */
interface MutationCtx {
  scheduler: {
    runAfter: (
      delayMs: number,
      fn: any,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
  };
}

/**
 * Helper central NEOCORTEX — à appeler dans chaque mutation métier.
 *
 * 1. Hippocampe : mémorise l'action (audit trail complet avant/après)
 * 2. Limbique : émet un signal pondéré pour routage vers les cortex
 */
export async function logCortexAction(
  ctx: MutationCtx,
  params: LogCortexParams,
) {
  const correlationId = crypto.randomUUID();

  // 1. Hippocampe : Mémorisation de l'action
  await ctx.scheduler.runAfter(0, internal.hippocampe.loguerAction, {
    action: params.action,
    categorie: params.categorie,
    entiteType: params.entiteType,
    entiteId: params.entiteId,
    userId: params.userId,
    details: {
      avant: params.avant ?? null,
      apres: params.apres ?? null,
    },
  });

  // 2. Limbique : Émission du signal
  await ctx.scheduler.runAfter(0, internal.limbique.emettreSignal, {
    type: params.signalType,
    source: "METIER",
    destination: params.destination,
    entiteType: params.entiteType,
    entiteId: params.entiteId,
    payload: {
      action: params.action,
      avant: params.avant,
      apres: params.apres,
    },
    confiance: 1,
    priorite: params.priorite ?? "NORMAL",
    correlationId,
  });
}
