/**
 * Phone number normalization utility.
 *
 * Uses the countryDialCodes list from constants.ts to properly identify
 * the country code length, then removes a leading 0 from the subscriber
 * number if present.
 *
 * Examples:
 *   "+33 06 12 34 56 78" → "+33612345678"
 *   "+330612345678"      → "+33612345678"
 *   "+33612345678"       → "+33612345678"  (already correct)
 *   "+241 07 12 34 56"   → "+241712345 6"
 *   "06 12 34 56 78"     → undefined (no country code)
 */
import { countryDialCodes } from "./constants";

// Build a Set of all known dial codes for fast lookup (sorted longest first)
const DIAL_CODES = countryDialCodes
	.map((c) => c.dial_code)
	.filter((v, i, a) => a.indexOf(v) === i) // deduplicate
	.sort((a, b) => b.length - a.length); // longest first for greedy match

export function normalizePhone(raw: string | undefined | null): string | undefined {
	if (!raw) return undefined;

	// 1. Strip whitespace, dashes, dots, parentheses
	let cleaned = raw.replace(/[\s\-\.\(\)]/g, "");

	// 2. Must start with +
	if (!cleaned.startsWith("+")) return undefined;

	// 3. Find the country dial code (greedy: try longest codes first)
	const digits = cleaned.slice(1); // everything after +
	let dialCode: string | undefined;
	for (const dc of DIAL_CODES) {
		if (digits.startsWith(dc)) {
			dialCode = dc;
			break;
		}
	}

	if (!dialCode) return undefined; // unknown country code

	// 4. Extract subscriber number and strip leading 0
	const subscriber = digits.slice(dialCode.length);
	const cleanSubscriber = subscriber.startsWith("0")
		? subscriber.slice(1)
		: subscriber;

	if (!cleanSubscriber) return undefined; // no subscriber digits

	// 5. Rebuild: +<dialCode><subscriber>
	cleaned = `+${dialCode}${cleanSubscriber}`;

	// 6. Validate: + followed by 7-15 digits total
	if (!/^\+\d{7,15}$/.test(cleaned)) return undefined;

	return cleaned;
}
