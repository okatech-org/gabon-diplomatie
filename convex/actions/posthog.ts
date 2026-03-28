"use node";

import { v } from "convex/values";
import { PostHog } from "posthog-node";
import { internalAction } from "../_generated/server";
import type { ServerAnalyticsEvents } from "../lib/posthogEvents";

let client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.POSTHOG_API_KEY, {
      host: "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Capture a server-side PostHog event.
 * Must be called from a Convex action with "use node".
 */
export async function captureServerEvent<T extends keyof ServerAnalyticsEvents>(
  distinctId: string,
  event: T,
  properties: ServerAnalyticsEvents[T],
) {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.capture({
    distinctId,
    event,
    properties: { ...properties, platform: "server" },
  });
  await ph.flush();
}

/**
 * Generic action to capture a server-side PostHog event.
 * Called via ctx.scheduler.runAfter from mutations/actions that can't use Node.js directly.
 */
export const capture = internalAction({
  args: {
    distinctId: v.string(),
    event: v.string(),
    properties: v.any(),
  },
  handler: async (_ctx, args) => {
    await captureServerEvent(
      args.distinctId,
      args.event as any,
      args.properties,
    );
  },
});
