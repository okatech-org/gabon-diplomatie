/**
 * One-shot migration: initialise the consularCardSequence counter
 * from the highest existing card number in the consularRegistrations table.
 *
 * Run once via the Convex dashboard (Functions → migrations/initCardCounter → Run).
 */
import { internalMutation } from "../_generated/server";

const COUNTER_NAME = "consularCardSequence";

export const run = internalMutation({
	handler: async (ctx) => {
		// 1. Find the current max sequence across all existing cards
		const registrations = await ctx.db
			.query("consularRegistrations")
			.withIndex("by_card_number")
			.collect();

		let maxSequence = 0;
		for (const reg of registrations) {
			if (reg.cardNumber) {
				const parts = reg.cardNumber.split("-");
				if (parts.length === 2) {
					const seq = parseInt(parts[1], 10);
					if (!isNaN(seq) && seq > maxSequence) {
						maxSequence = seq;
					}
				}
			}
		}

		// 2. Upsert the counter
		const existing = await ctx.db
			.query("counters")
			.withIndex("by_name", (q) => q.eq("name", COUNTER_NAME))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, { value: maxSequence });
			console.log(
				`Counter "${COUNTER_NAME}" updated to ${maxSequence} (was ${existing.value})`,
			);
		} else {
			await ctx.db.insert("counters", {
				name: COUNTER_NAME,
				value: maxSequence,
			});
			console.log(
				`Counter "${COUNTER_NAME}" created with value ${maxSequence}`,
			);
		}

		return { counterName: COUNTER_NAME, value: maxSequence };
	},
});
