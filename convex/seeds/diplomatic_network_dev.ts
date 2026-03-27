/**
 * Seed DEV du réseau diplomatique (3 postes seulement)
 *
 * Postes inclus:
 *   1. Ambassade du Gabon en France (fr-ambassade-paris)
 *   2. Consulat Général du Gabon à Paris (fr-consulat-paris)
 *   3. Ambassade du Gabon au Canada (ca-ambassade-ottawa)
 *
 * Utilisation:
 *   npx convex run seeds/diplomatic_network_dev:seedDiplomaticNetworkDev
 */
import { mutation } from "../_generated/server";
import { OrganizationType } from "../lib/constants";

const DEV_NETWORK = [
  {
    slug: "fr-ambassade-paris",
    name: "Ambassade du Gabon en France",
    type: OrganizationType.Embassy,
    country: "FR",
    timezone: "Europe/Paris",
    address: { city: "Paris", street: "26 bis, Avenue Raphaël, 75016" },
    jurisdictionCountries: ["FR", "PT", "MC", "AD"],
    phone: "+33 1 42 99 68 68",
    email: "ambassade.gabonfrance@gmail.com",
    website: "ambassadedugabonenfrance.com",
    openingHours: {
      monday: { open: "09:00", close: "16:30" },
      tuesday: { open: "09:00", close: "16:30" },
      wednesday: { open: "09:00", close: "16:30" },
      thursday: { open: "09:00", close: "16:30" },
      friday: { open: "09:00", close: "16:00" },
      saturday: { closed: true },
      sunday: { closed: true },
      notes: "Couvre également l'OIF.",
    },
  },
  {
    slug: "fr-consulat-paris",
    name: "Consulat Général du Gabon à Paris",
    type: OrganizationType.GeneralConsulate,
    country: "FR",
    timezone: "Europe/Paris",
    address: { city: "Paris", street: "26 bis, Avenue Raphaël, 75016" },
    jurisdictionCountries: ["FR"],
    phone: "+33 1 42 99 68 62",
    email: "cgeneralgabon@hotmail.fr",
    notes:
      "Horaires : Lun-Jeu 09h00-16h30, Ven 09h00-16h00. Services : Visas, Passeports (DGDI), État civil.",
    openingHours: {
      monday: { open: "09:00", close: "16:30" },
      tuesday: { open: "09:00", close: "16:30" },
      wednesday: { open: "09:00", close: "16:30" },
      thursday: { open: "09:00", close: "16:30" },
      friday: { open: "09:00", close: "16:00" },
      saturday: { closed: true },
      sunday: { closed: true },
    },
  },
  {
    slug: "ca-ambassade-ottawa",
    name: "Ambassade du Gabon au Canada",
    type: OrganizationType.Embassy,
    country: "CA",
    timezone: "America/Toronto",
    address: { city: "Ottawa", street: "1285, rue Labelle" },
    jurisdictionCountries: ["CA"],
    phone: "+1 613 232 5301",
    website: "ambassadegabon.ca",
    openingHours: {
      monday: { open: "09:00", close: "16:30" },
      tuesday: { open: "09:00", close: "16:30" },
      wednesday: { open: "09:00", close: "16:30" },
      thursday: { open: "09:00", close: "16:30" },
      friday: { open: "09:00", close: "16:00" },
      saturday: { closed: true },
      sunday: { closed: true },
    },
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export const seedDiplomaticNetworkDev = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const org of DEV_NETWORK) {
      try {
        const existing = await ctx.db
          .query("orgs")
          .withIndex("by_slug", (q) => q.eq("slug", org.slug))
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }

        const address = {
          street: org.address.street,
          city: org.address.city,
          postalCode: "",
          country: org.country,
        };

        await ctx.db.insert("orgs", {
          slug: org.slug,
          name: org.name,
          type: org.type,
          country: org.country,
          timezone: org.timezone,
          address,

          ...(org.jurisdictionCountries && {
            jurisdictionCountries: org.jurisdictionCountries,
          }),
          ...(org.phone && { phone: org.phone }),
          ...((org as any).email && { email: (org as any).email }),
          ...((org as any).website && { website: (org as any).website }),
          ...((org as any).notes && { notes: (org as any).notes }),
          ...(org.openingHours && { openingHours: org.openingHours }),
          isActive: true,
        } as any);

        results.created++;
      } catch (error) {
        results.errors.push(
          `${org.slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return results;
  },
});
