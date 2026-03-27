import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Payment status enum
 */
export const paymentStatusValidator = v.union(
	v.literal("pending"),
	v.literal("processing"),
	v.literal("succeeded"),
	v.literal("failed"),
	v.literal("refunded"),
	v.literal("cancelled")
);

/**
 * Payments table - tracks all payment transactions
 */
export const paymentsTable = defineTable({
	// References
	requestId: v.id("requests"),
	userId: v.id("users"),
	orgId: v.id("orgs"),

	// Stripe identifiers
	stripePaymentIntentId: v.optional(v.string()),
	stripeSessionId: v.optional(v.string()),
	stripeCustomerId: v.optional(v.string()),

	// Amount
	amount: v.number(), // In cents
	currency: v.string(), // "eur", "usd"

	// Status
	status: paymentStatusValidator,

	// Metadata
	description: v.optional(v.string()),
	receiptUrl: v.optional(v.string()),

	// Timestamps
	paidAt: v.optional(v.number()),
	refundedAt: v.optional(v.number()),
	failedAt: v.optional(v.number()),

	// Refund info
	refundAmount: v.optional(v.number()),
	refundReason: v.optional(v.string()),

	updatedAt: v.optional(v.number()),
})
	.index("by_request", ["requestId"])
	.index("by_user", ["userId"])
	.index("by_org", ["orgId"])
	.index("by_org_status", ["orgId", "status"])
	.index("by_stripe_intent", ["stripePaymentIntentId"])
	.index("by_stripe_session", ["stripeSessionId"]);
