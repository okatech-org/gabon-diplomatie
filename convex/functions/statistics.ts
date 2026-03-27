import { v } from "convex/values";
import { authQuery } from "../lib/customFunctions";
import { getMembership } from "../lib/auth";
import { assertCanDoTask } from "../lib/permissions";
import { RequestStatus } from "../lib/constants";
import { requestsByOrg, membershipsByOrg } from "../lib/aggregates";

/**
 * Get comprehensive statistics for an organization.
 * Uses the Aggregate component for O(log n) counts instead of loading all rows.
 */
export const getOrgStats = authQuery({
  args: {
    orgId: v.id("orgs"),
    period: v.optional(
      v.union(v.literal("week"), v.literal("month"), v.literal("year")),
    ),
    currentTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const membership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "statistics.view");

    const now = args.currentTime ?? Date.now();
    const periodMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    const period = args.period || "month";
    const periodStart = now - periodMs[period];
    const previousPeriodStart = periodStart - periodMs[period];
    const ns = args.orgId as string;

    // ─── Aggregate-powered counts (O(log n)) ───────────────────────
    const [
      totalRequests,
      draftCount,
      pendingCount,
      processingCount,
      completedCount,
      cancelledCount,
      memberCount,
    ] = await Promise.all([
      // Total requests for this org
      requestsByOrg.count(ctx, { namespace: ns }),
      // By status — using { prefix: [status] } on the [status, _creationTime] key
      requestsByOrg.count(ctx, {
        namespace: ns,
        bounds: { prefix: ["draft"] },
      }),
      requestsByOrg.count(ctx, {
        namespace: ns,
        bounds: { prefix: ["pending"] },
      }),
      requestsByOrg.count(ctx, {
        namespace: ns,
        bounds: { prefix: ["processing"] },
      }),
      requestsByOrg.count(ctx, {
        namespace: ns,
        bounds: { prefix: ["completed"] },
      }),
      requestsByOrg.count(ctx, {
        namespace: ns,
        bounds: { prefix: ["cancelled"] },
      }),
      // Members
      membershipsByOrg.count(ctx, { namespace: ns }),
    ]);

    // For period-based trends, query recent requests only (much lighter than a full scan)
    const recentRequests = await ctx.db
      .query("requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.gte(q.field("_creationTime"), previousPeriodStart))
      .take(2000);

    const currentPeriodCount = recentRequests.filter(
      (r) => r._creationTime >= periodStart,
    ).length;
    const previousPeriodCount = recentRequests.filter(
      (r) =>
        r._creationTime >= previousPeriodStart && r._creationTime < periodStart,
    ).length;
    const completedInPeriod = recentRequests.filter(
      (r) =>
        r._creationTime >= periodStart && r.status === RequestStatus.Completed,
    ).length;

    // Average processing time — from recent completed requests
    const completedRequests = await ctx.db
      .query("requests")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", RequestStatus.Completed),
      )
      .order("desc")
      .take(200);

    let avgProcessingDays = 0;
    const withCompletedAt = completedRequests.filter((r) => r.completedAt);
    if (withCompletedAt.length > 0) {
      const totalDays = withCompletedAt.reduce((sum, r) => {
        const days = (r.completedAt! - r._creationTime) / (24 * 60 * 60 * 1000);
        return sum + days;
      }, 0);
      avgProcessingDays = Math.round(totalDays / withCompletedAt.length);
    }

    // Service breakdown
    const allRequests = await ctx.db
      .query("requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", args.orgId))
      .take(2000);

    const serviceBreakdown: Record<string, number> = {};
    for (const req of allRequests) {
      const serviceId = req.orgServiceId.toString();
      serviceBreakdown[serviceId] = (serviceBreakdown[serviceId] || 0) + 1;
    }

    const orgServiceIds = [...new Set(allRequests.map((r) => r.orgServiceId))];
    const orgServices = await Promise.all(
      orgServiceIds.map((id) => ctx.db.get(id)),
    );
    const serviceIds = orgServices.filter(Boolean).map((os) => os!.serviceId);
    const services = await Promise.all(serviceIds.map((id) => ctx.db.get(id)));

    const serviceLabels: Record<string, string> = {};
    orgServices.forEach((os, i) => {
      if (os && services[i]) {
        const name = services[i]!.name;
        serviceLabels[os._id.toString()] =
          typeof name === "object" ? name.fr : String(name);
      }
    });

    const serviceStats = Object.entries(serviceBreakdown)
      .map(([id, count]) => ({
        serviceId: id,
        name: serviceLabels[id] || "Service inconnu",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Upcoming appointments — query the appointments table directly
    const upcomingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_org_date", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "cancelled"),
          q.neq(q.field("status"), "completed"),
        ),
      )
      .take(500);

    // Daily trend
    const trendDays = period === "week" ? 7 : 30;
    const trend: { date: string; count: number }[] = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayCount = recentRequests.filter(
        (r) =>
          r._creationTime >= dayStart.getTime() &&
          r._creationTime <= dayEnd.getTime(),
      ).length;

      trend.push({
        date: dayStart.toISOString().split("T")[0],
        count: dayCount,
      });
    }

    const growthPercentage = Math.round(
      ((currentPeriodCount - (previousPeriodCount || 1)) /
        (previousPeriodCount || 1)) *
        100,
    );

    return {
      totalRequests,
      currentPeriodRequests: currentPeriodCount,
      growthPercentage,
      avgProcessingDays,
      statusCounts: {
        draft: draftCount,
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      serviceStats,
      trend,
      completedThisPeriod: completedInPeriod,
      upcomingAppointments: upcomingAppointments.length,
      memberCount,
      period,
      generatedAt: now,
    };
  },
});

/**
 * Get agent performance stats.
 */
export const getAgentStats = authQuery({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    const membership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "statistics.view");

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_org_deletedAt", (q) => q.eq("orgId", args.orgId).eq("deletedAt", undefined))
      .collect();

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", args.orgId))
      .take(2000);

    const agentStats: Record<
      string,
      { assigned: number; completed: number; avgDays: number }
    > = {};

    for (const m of memberships) {
      agentStats[m.userId.toString()] = {
        assigned: 0,
        completed: 0,
        avgDays: 0,
      };
    }

    for (const req of requests) {
      if (req.assignedTo) {
        const agentId = req.assignedTo.toString();
        if (agentStats[agentId]) {
          agentStats[agentId].assigned++;
          if (req.status === RequestStatus.Completed) {
            agentStats[agentId].completed++;
          }
        }
      }
    }

    const userIds = memberships.map((m) => m.userId);
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));

    const agentPerformance = memberships
      .map((m, i) => {
        const user = users[i];
        const stats = agentStats[m.userId.toString()];
        return {
          userId: m.userId,
          name: user?.name || user?.email || "Agent inconnu",
          assigned: stats.assigned,
          completed: stats.completed,
          completionRate:
            stats.assigned > 0 ?
              Math.round((stats.completed / stats.assigned) * 100)
            : 0,
        };
      })
      .sort((a, b) => b.completed - a.completed);

    return {
      agents: agentPerformance,
      totalAgents: memberships.length,
    };
  },
});

/**
 * Export requests data as JSON
 */
export const exportRequests = authQuery({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const membership = await getMembership(ctx, ctx.user._id, args.orgId);
    await assertCanDoTask(ctx, ctx.user, membership, "statistics.view");

    let requests = await ctx.db
      .query("requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", args.orgId))
      .take(5000);

    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }
    if (args.fromDate) {
      requests = requests.filter((r) => r._creationTime >= args.fromDate!);
    }
    if (args.toDate) {
      requests = requests.filter((r) => r._creationTime <= args.toDate!);
    }

    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(
      users.filter(Boolean).map((u) => [u!._id.toString(), u!]),
    );

    const orgServiceIds = [...new Set(requests.map((r) => r.orgServiceId))];
    const orgServices = await Promise.all(
      orgServiceIds.map((id) => ctx.db.get(id)),
    );

    const serviceIds = orgServices.filter(Boolean).map((os) => os!.serviceId);
    const services = await Promise.all(serviceIds.map((id) => ctx.db.get(id)));
    const serviceMap = new Map(
      orgServices
        .filter(Boolean)
        .map((os, i) => [
          os!._id.toString(),
          services[i]?.name || "Service inconnu",
        ]),
    );

    return requests.map((r) => {
      const user = userMap.get(r.userId.toString());
      const serviceTitle = serviceMap.get(r.orgServiceId.toString());

      return {
        reference: r.reference,
        status: r.status,
        service:
          typeof serviceTitle === "object" ?
            (serviceTitle as any).fr
          : serviceTitle,
        userEmail: user?.email || "",
        userName: user?.name || "",
        createdAt: new Date(r._creationTime).toISOString(),
        completedAt:
          r.completedAt ? new Date(r.completedAt).toISOString() : null,
        depositAppointmentId: r.depositAppointmentId ?? null,
        pickupAppointmentId: r.pickupAppointmentId ?? null,
      };
    });
  },
});
