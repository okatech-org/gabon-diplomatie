import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Appointment status enum values
 */
export const AppointmentStatus = {
  Confirmed: "confirmed",
  Cancelled: "cancelled",
  Completed: "completed",
  NoShow: "no_show",
  Rescheduled: "rescheduled",
} as const;

export const appointmentStatusValidator = v.union(
  v.literal(AppointmentStatus.Confirmed),
  v.literal(AppointmentStatus.Cancelled),
  v.literal(AppointmentStatus.Completed),
  v.literal(AppointmentStatus.NoShow),
  v.literal(AppointmentStatus.Rescheduled)
);

/**
 * Appointment type: deposit (dépôt) or pickup (retrait)
 */
export const appointmentTypeValidator = v.union(
  v.literal("deposit"),
  v.literal("pickup"),
);

/**
 * Appointment — A booked appointment
 * Dynamic: no pre-generated slots, computed on-the-fly.
 */
export const appointmentsTable = defineTable({
  // Link to the request that triggered this appointment
  requestId: v.optional(v.id("requests")),
  
  // Attendee (citizen) — references profiles table
  attendeeProfileId: v.id("profiles"),
  
  // Organization
  orgId: v.id("orgs"),
  
  // Agent handling this appointment (membership in the org)
  agentId: v.optional(v.id("memberships")),

  // Service this appointment is for
  orgServiceId: v.optional(v.id("orgServices")),
  
  // Appointment type: deposit or pickup
  appointmentType: v.optional(appointmentTypeValidator),
  
  // Time fields
  date: v.string(), // YYYY-MM-DD
  time: v.string(), // HH:mm (start time)
  endTime: v.optional(v.string()), // HH:mm (end time)
  durationMinutes: v.optional(v.number()),
  
  // Status
  status: appointmentStatusValidator,
  
  // Timestamps
  confirmedAt: v.optional(v.number()),
  cancelledAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  reminderSentAt: v.optional(v.number()),
  
  // Notes
  notes: v.optional(v.string()),
  cancellationReason: v.optional(v.string()),
})
  .index("by_attendee", ["attendeeProfileId"])
  .index("by_org_date", ["orgId", "date"])
  .index("by_org_date_status", ["orgId", "date", "status"])
  .index("by_request", ["requestId"])
  .index("by_attendee_status", ["attendeeProfileId", "status"])
  .index("by_agent_date", ["agentId", "date"]);
