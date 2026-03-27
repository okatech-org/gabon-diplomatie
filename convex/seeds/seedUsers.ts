/**
 * Seed users into the custom `users` table from Better Auth IDs.
 *
 * Called by seed-test-accounts.ts after creating Better Auth accounts.
 * Maps Better Auth user IDs to `authId` in the users table.
 *
 * Usage:
 *   npx convex run seeds/seedUsers:seedUsers '{"users": [...]}'
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const seedUsers = mutation({
	args: {
		users: v.array(
			v.object({
				authId: v.string(),
				email: v.string(),
				name: v.string(),
				isSuperadmin: v.optional(v.boolean()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const results = { created: 0, skipped: 0, errors: [] as string[] };

		for (const user of args.users) {
			try {
				// Skip if already exists
				const existing = await ctx.db
					.query("users")
					.withIndex("by_authId", (q) =>
						q.eq("authId", user.authId),
					)
					.unique();

				if (existing) {
					results.skipped++;
					continue;
				}

				// Also check by email
				const existingByEmail = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", user.email))
					.unique();

				if (existingByEmail) {
					// Link existing placeholder user to Better Auth ID
					await ctx.db.patch(existingByEmail._id, {
						authId: user.authId,
						name: user.name,
						updatedAt: Date.now(),
					});
					results.skipped++;
					continue;
				}

				await ctx.db.insert("users", {
					authId: user.authId,
					email: user.email,
					name: user.name,
					isActive: true,
					isSuperadmin: user.isSuperadmin ?? false,
					updatedAt: Date.now(),
				});
				results.created++;
			} catch (error) {
				results.errors.push(
					`${user.email}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		return results;
	},
});
