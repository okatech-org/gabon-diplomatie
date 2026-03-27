/**
 * Request Workflow - State Machine
 * 
 * Defines valid status transitions and workflow helpers for request processing.
 * Labels are handled by i18n on the frontend.
 */

import { RequestStatus } from "./constants";

// ═══════════════════════════════════════════════════════════════════════════
// STATUS METADATA (server-side only - no labels)
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusMetadata {
  color: string;
  icon: string;
  phase: 'creation' | 'processing' | 'finalization' | 'terminal';
}

export const REQUEST_STATUS_METADATA: Record<RequestStatus, StatusMetadata> = {
  // === Création ===
  [RequestStatus.Draft]: { color: "gray", icon: "edit", phase: "creation" },
  [RequestStatus.Submitted]: { color: "blue", icon: "send", phase: "creation" },

  // === Traitement ===
  [RequestStatus.Pending]: { color: "yellow", icon: "clock", phase: "processing" },
  [RequestStatus.UnderReview]: { color: "blue", icon: "eye", phase: "processing" },
  [RequestStatus.InProduction]: { color: "purple", icon: "printer", phase: "processing" },

  // === Finalisation ===
  [RequestStatus.Validated]: { color: "green", icon: "check", phase: "finalization" },
  [RequestStatus.Rejected]: { color: "red", icon: "x", phase: "terminal" },
  [RequestStatus.AppointmentScheduled]: { color: "blue", icon: "calendar", phase: "finalization" },
  [RequestStatus.ReadyForPickup]: { color: "green", icon: "package", phase: "finalization" },

  // === Terminé ===
  [RequestStatus.Completed]: { color: "green", icon: "check-circle", phase: "terminal" },
  [RequestStatus.Cancelled]: { color: "gray", icon: "x-circle", phase: "terminal" },
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE - VALID TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Defines which statuses can transition to which other statuses.
 * Key = current status, Value = array of valid next statuses
 */
export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  // Création
  [RequestStatus.Draft]: [
    RequestStatus.Submitted,          // Soumission initiale
    RequestStatus.Cancelled,
  ],
  [RequestStatus.Submitted]: [
    RequestStatus.Pending,            // Prise en charge (auto ou manuelle)
    RequestStatus.UnderReview,        // Examen direct
    RequestStatus.Cancelled,
  ],

  // Traitement
  [RequestStatus.Pending]: [
    RequestStatus.UnderReview,        // Agent commence examen
    RequestStatus.Cancelled,          // User annule
  ],
  [RequestStatus.UnderReview]: [
    RequestStatus.Validated,           // Approuvé
    RequestStatus.Rejected,            // Rejeté
    RequestStatus.AppointmentScheduled,// RDV requis
    RequestStatus.InProduction,        // Création document
  ],
  [RequestStatus.InProduction]: [
    RequestStatus.ReadyForPickup,      // Document prêt
    RequestStatus.Validated,           // Validation finale
  ],

  // Finalisation
  [RequestStatus.Validated]: [
    RequestStatus.InProduction,        // Lancement production
    RequestStatus.ReadyForPickup,      // Déjà prêt
    RequestStatus.Completed,           // Livraison électronique
  ],
  [RequestStatus.AppointmentScheduled]: [
    RequestStatus.UnderReview,         // RDV passé, retour examen
    RequestStatus.Validated,           // Validé après RDV
    RequestStatus.Cancelled,           // RDV annulé
  ],
  [RequestStatus.ReadyForPickup]: [
    RequestStatus.Completed,           // Retiré
  ],

  // Terminal (pas de transition)
  [RequestStatus.Completed]: [],
  [RequestStatus.Cancelled]: [],
  [RequestStatus.Rejected]: [
    RequestStatus.Draft,               // Possibilité de recommencer
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a transition from one status to another is valid
 */
export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  const validTransitions = REQUEST_TRANSITIONS[from];
  return validTransitions?.includes(to) ?? false;
}

/**
 * Assert that a transition is valid, throw error if not
 */
export function assertCanTransition(from: RequestStatus, to: RequestStatus): void {
  if (!canTransition(from, to)) {
    const validOptions = REQUEST_TRANSITIONS[from]?.join(", ") || "none";
    throw new Error(
      `Invalid transition from "${from}" to "${to}". Valid options: ${validOptions}`
    );
  }
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(current: RequestStatus): RequestStatus[] {
  return REQUEST_TRANSITIONS[current] ?? [];
}

/**
 * Check if a status is terminal (no further transitions possible)
 */
export function isTerminalStatus(status: RequestStatus): boolean {
  return REQUEST_STATUS_METADATA[status]?.phase === "terminal";
}

/**
 * Check if a status requires user action
 */
export function requiresUserAction(status: RequestStatus): boolean {
  return [
    RequestStatus.Draft,
    RequestStatus.AppointmentScheduled,
    RequestStatus.ReadyForPickup,
  ].includes(status);
}

/**
 * Check if a status requires agent action
 */
export function requiresAgentAction(status: RequestStatus): boolean {
  return [
    RequestStatus.Pending,
    RequestStatus.Submitted,
    RequestStatus.UnderReview,
    RequestStatus.InProduction,
  ].includes(status);
}
