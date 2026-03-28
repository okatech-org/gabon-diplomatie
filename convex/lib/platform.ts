/**
 * Platform detection utility for multi-app email and notification customization.
 *
 * Maps request Origin headers to platform-specific configuration
 * (sender name, header title, footer text, app URL).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Platform = "citizen" | "agent" | "backoffice";

export interface PlatformConfig {
  platform: Platform;
  /** Display name used as email sender (e.g. "Consulat.ga") */
  senderName: string;
  /** Header title in email templates */
  headerTitle: string;
  /** Footer line in email templates */
  footerText: string;
  /** Public-facing app URL (used in email links) */
  appUrl: string;
}

// ---------------------------------------------------------------------------
// Platform configs
// ---------------------------------------------------------------------------

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  citizen: {
    platform: "citizen",
    senderName: "Consulat.ga",
    headerTitle: "Consulat.ga",
    footerText: "Plateforme consulaire de la République Gabonaise — consulat.ga",
    appUrl: "https://consulat.ga",
  },
  agent: {
    platform: "agent",
    senderName: "Diplomate.ga",
    headerTitle: "Diplomate.ga",
    footerText:
      "Portail agent consulaire — diplomate.ga",
    appUrl: "https://diplomate.ga",
  },
  backoffice: {
    platform: "backoffice",
    senderName: "Admin Consulat.ga",
    headerTitle: "Admin — Consulat.ga",
    footerText:
      "Back-office d'administration — admin.consulat.ga",
    appUrl: "https://admin.consulat.ga",
  },
};

// ---------------------------------------------------------------------------
// Hostname → Platform lookup
// ---------------------------------------------------------------------------

/** Map of hostname (or hostname:port) → Platform */
const HOSTNAME_MAP: Record<string, Platform> = {
  // Production
  "consulat.ga": "citizen",
  "www.consulat.ga": "citizen",
  "diplomate.ga": "agent",
  "www.diplomate.ga": "agent",
  "admin.consulat.ga": "backoffice",

  // Local dev
  "localhost:3000": "citizen",
  "consulat.local:3000": "citizen",
  "localhost:3003": "agent",
  "diplomate.local:3003": "agent",
  "localhost:3002": "backoffice",
  "admin.consulat.local:3002": "backoffice",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect which platform originated the request based on the Origin header.
 *
 * Falls back to "citizen" when the origin is unknown or missing.
 */
export function detectPlatform(origin?: string | null): PlatformConfig {
  if (!origin) return PLATFORM_CONFIGS.citizen;

  try {
    const url = new URL(origin);
    const host = url.host; // includes port if present

    // Direct lookup
    const platform = HOSTNAME_MAP[host];
    if (platform) return PLATFORM_CONFIGS[platform];

    // Fallback: check if hostname contains a known keyword
    // (covers Cloud Run auto-generated URLs like citizen-web-xxx.run.app)
    const hostname = url.hostname;
    if (hostname.includes("agent")) return PLATFORM_CONFIGS.agent;
    if (hostname.includes("backoffice") || hostname.includes("admin"))
      return PLATFORM_CONFIGS.backoffice;

    return PLATFORM_CONFIGS.citizen;
  } catch {
    return PLATFORM_CONFIGS.citizen;
  }
}

/**
 * Build the "From" email address with a platform-specific display name.
 *
 * The actual email address stays the same (Resend verified sender),
 * only the display name changes.
 */
export function fromEmail(config: PlatformConfig): string {
  const address =
    process.env.RESEND_FROM_ADDRESS ?? "mail@updates.consulat.ga";
  return `${config.senderName} <${address}>`;
}

/**
 * Get the platform config for a known platform string.
 */
export function getPlatformConfig(
  platform?: string | null,
): PlatformConfig {
  if (platform && platform in PLATFORM_CONFIGS) {
    return PLATFORM_CONFIGS[platform as Platform];
  }
  return PLATFORM_CONFIGS.citizen;
}
