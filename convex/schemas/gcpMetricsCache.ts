import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Cache for GCP infrastructure metrics.
 * Stores fetched data from Cloud Run, Compute Engine, and Cloud Monitoring APIs.
 * TTL-based refresh to avoid excessive API calls.
 */
export const gcpMetricsCacheTable = defineTable({
  key: v.string(), // "cloud_run" | "livekit_vm" | "metrics_cloud_run" | "metrics_livekit"
  data: v.any(), // Raw JSON from the GCP APIs
  fetchedAt: v.number(), // Timestamp of last fetch
}).index("by_key", ["key"]);
