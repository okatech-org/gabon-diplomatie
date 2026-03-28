/**
 * Server-side analytics events for PostHog.
 * These events are captured from Convex actions and crons,
 * enabling PostHog alerting on critical business events.
 */
export type ServerAnalyticsEvents = {
  // Payments
  server_payment_failed: { requestId: string; amount: number; error?: string };
  server_payment_succeeded: { requestId: string; amount: number };
  server_payment_refunded: { requestId: string; amount: number };

  // Documents
  server_document_verification_failed: { documentId: string; reason: string };

  // Health check (cron-emitted summaries for alerting)
  server_health_stale_requests: { count: number; oldestDays: number };
  server_health_failed_payments_24h: { count: number; totalAmount: number };
  server_health_pending_verifications: { count: number; oldestHours: number };
};
