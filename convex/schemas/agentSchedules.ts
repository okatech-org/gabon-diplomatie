import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Day of week validator for schedule templates
 */
export const dayOfWeekValidator = v.union(
  v.literal("monday"),
  v.literal("tuesday"),
  v.literal("wednesday"),
  v.literal("thursday"),
  v.literal("friday"),
  v.literal("saturday"),
  v.literal("sunday"),
);

/**
 * Time range for a schedule block (e.g., 09:00 - 12:00)
 */
export const scheduleTimeRangeValidator = v.object({
  start: v.string(), // "09:00"
  end: v.string(),   // "12:00"
});

/**
 * A single day entry in the weekly schedule
 */
export const scheduleDayValidator = v.object({
  day: dayOfWeekValidator,
  timeRanges: v.array(scheduleTimeRangeValidator),
});

/**
 * Exception entry for specific dates (holidays, absences, modified hours)
 */
export const scheduleExceptionValidator = v.object({
  date: v.string(),        // "2026-03-15" (YYYY-MM-DD)
  available: v.boolean(),  // false = day off, true = modified hours
  timeRanges: v.optional(v.array(scheduleTimeRangeValidator)), // If available=true, custom hours
  reason: v.optional(v.string()), // "Jour férié", "Congé", etc.
});

/**
 * AgentSchedules - Recurring weekly availability templates per agent
 * 
 * Defines WHEN an agent is available for appointments.
 * Used to dynamically compute available appointment slots.
 */
export const agentSchedulesTable = defineTable({
  // Organization this schedule belongs to
  orgId: v.id("orgs"),

  // The agent (membership in the org)
  agentId: v.id("memberships"),

  // Optional: scope this schedule to a specific org service
  // If null, the agent is available for all services
  orgServiceId: v.optional(v.id("orgServices")),

  // Weekly template — array of day entries with time ranges
  // Example: [{ day: "monday", timeRanges: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] }]
  weeklySchedule: v.array(scheduleDayValidator),

  // Override: specific date exceptions (holidays, absences, modified hours)
  exceptions: v.optional(v.array(scheduleExceptionValidator)),

  // Active state
  isActive: v.boolean(),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_org_agent", ["orgId", "agentId"])
  .index("by_org", ["orgId"])
  .index("by_org_active", ["orgId", "isActive"]);
