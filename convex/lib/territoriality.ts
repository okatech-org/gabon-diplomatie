/**
 * Territoriality Logic
 * 
 * Manages the relationship between citizens and consular organizations
 * based on their residence and current location.
 * 
 * Key concepts:
 * - managedByOrgId: The organization where the citizen is registered (based on residence > 6 months)
 * - signaledToOrgId: The organization where the citizen is temporarily located (< 6 months)
 */

import { Id } from "../_generated/dataModel";
import { CountryCode } from "./countryCodeValidator";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Minimum months of stay to be considered a resident (triggers org transfer) */
export const RESIDENCE_THRESHOLD_MONTHS = 6;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TerritorialityParams {
  /** Country where the user officially resides */
  residenceCountry: CountryCode;
  /** Country where the user is currently located */
  currentLocation: CountryCode;
  /** Duration of current stay in months */
  stayDuration: number;
}

export interface TerritorialityResult {
  /** 
   * The organization that manages this user's consular affairs.
   * Based on residence country (stays >= 6 months).
   */
  shouldTransferToCurrentLocation: boolean;
  
  /**
   * Whether the user should be signaled to the org in their current location.
   * True when currentLocation differs from residenceCountry AND stayDuration < 6 months.
   */
  shouldSignalToCurrentLocation: boolean;
  
  /**
   * Explanation of the determination for debugging/display.
   */
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine the organizational relationship for a user based on territoriality rules.
 * 
 * Rules:
 * 1. User stays >= 6 months in current location → Transfer management to local org
 * 2. User stays < 6 months in different country → Signal to local org, keep original management
 * 3. User in residence country → No signaling needed
 * 
 * @param params The user's residence and location information
 * @returns Determination of organizational relationships
 */
export function determineTerritoriality(
  params: TerritorialityParams
): TerritorialityResult {
  const { residenceCountry, currentLocation, stayDuration } = params;

  // Same country = no change needed
  if (residenceCountry === currentLocation) {
    return {
      shouldTransferToCurrentLocation: false,
      shouldSignalToCurrentLocation: false,
      explanation: `L'usager réside et se trouve dans le même pays (${residenceCountry}).`,
    };
  }

  // Different country, check duration
  if (stayDuration >= RESIDENCE_THRESHOLD_MONTHS) {
    // Long stay = transfer management
    return {
      shouldTransferToCurrentLocation: true,
      shouldSignalToCurrentLocation: false,
      explanation: `Séjour de ${stayDuration} mois (≥ ${RESIDENCE_THRESHOLD_MONTHS}). L'usager devrait être rattaché à l'organisation de ${currentLocation}.`,
    };
  }

  // Short stay = signal only
  return {
    shouldTransferToCurrentLocation: false,
    shouldSignalToCurrentLocation: true,
    explanation: `Séjour temporaire de ${stayDuration} mois (< ${RESIDENCE_THRESHOLD_MONTHS}). Signalement à ${currentLocation}, rattachement maintenu à ${residenceCountry}.`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine if a user is traveling (in a different country than residence)
 */
export function isTraveling(
  residenceCountry: CountryCode,
  currentLocation: CountryCode
): boolean {
  return residenceCountry !== currentLocation;
}

/**
 * Determine if a stay is considered long-term (>= 6 months)
 */
export function isLongTermStay(stayDuration: number): boolean {
  return stayDuration >= RESIDENCE_THRESHOLD_MONTHS;
}

/**
 * Get the appropriate org IDs for a user based on their location.
 * This is a placeholder that would be implemented with actual DB queries.
 * 
 * @param residenceCountry The user's residence country
 * @param currentLocation The user's current location
 * @param stayDuration Duration of current stay in months
 * @param orgsByCountry A map of country codes to org IDs
 */
export function resolveOrganizationIds(
  residenceCountry: CountryCode,
  currentLocation: CountryCode,
  stayDuration: number,
  orgsByCountry: Map<CountryCode, Id<"orgs">>
): {
  managedByOrgId: Id<"orgs"> | null;
  signaledToOrgId: Id<"orgs"> | null;
} {
  const result = determineTerritoriality({
    residenceCountry,
    currentLocation,
    stayDuration,
  });

  const residenceOrg = orgsByCountry.get(residenceCountry) ?? null;
  const currentOrg = orgsByCountry.get(currentLocation) ?? null;

  if (result.shouldTransferToCurrentLocation) {
    return {
      managedByOrgId: currentOrg,
      signaledToOrgId: null,
    };
  }

  if (result.shouldSignalToCurrentLocation) {
    return {
      managedByOrgId: residenceOrg,
      signaledToOrgId: currentOrg,
    };
  }

  return {
    managedByOrgId: residenceOrg,
    signaledToOrgId: null,
  };
}
