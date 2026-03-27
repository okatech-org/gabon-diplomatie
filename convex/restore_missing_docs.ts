import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { DocumentTypeCategory } from "./lib/constants";

/**
 * Backfill child profile document references.
 * For each child profile, query the documents table for documents owned by that profile,
 * then update the child profile's `documents` field with the correct references.
 */
export const backfillChildProfileDocs = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allChildProfiles = await ctx.db.query("childProfiles").collect();
    const limit = args.limit ?? allChildProfiles.length;
    const dryRun = args.dryRun ?? false;

    let updated = 0;
    let skipped = 0;
    let alreadyComplete = 0;

    for (let i = 0; i < Math.min(allChildProfiles.length, limit); i++) {
      const cp = allChildProfiles[i];

      // Query all documents owned by this child profile
      const docs = await ctx.db
        .query("documents")
        .withIndex("by_owner", (q) => q.eq("ownerId", cp._id))
        .collect();

      if (docs.length === 0) {
        skipped++;
        continue;
      }

      // Build the documents reference object
      const docRefs: {
        passport?: typeof docs[0]["_id"];
        birthCertificate?: typeof docs[0]["_id"];
        residencePermit?: typeof docs[0]["_id"];
        addressProof?: typeof docs[0]["_id"];
        photo?: typeof docs[0]["_id"];
      } = { ...(cp.documents || {}) };

      for (const doc of docs) {
        const type = doc.documentType;
        if (type === "passport" && !docRefs.passport) {
          docRefs.passport = doc._id;
        } else if (type === "birth_certificate" && !docRefs.birthCertificate) {
          docRefs.birthCertificate = doc._id;
        } else if (type === "residence_permit" && !docRefs.residencePermit) {
          docRefs.residencePermit = doc._id;
        } else if (type === "proof_of_address" && !docRefs.addressProof) {
          docRefs.addressProof = doc._id;
        } else if (type === "identity_photo" && !docRefs.photo) {
          docRefs.photo = doc._id;
        }
      }

      // Check if anything changed
      const existing = cp.documents || {};
      const hasChanges =
        docRefs.passport !== existing.passport ||
        docRefs.birthCertificate !== existing.birthCertificate ||
        docRefs.residencePermit !== existing.residencePermit ||
        docRefs.addressProof !== existing.addressProof ||
        docRefs.photo !== existing.photo;

      if (!hasChanges) {
        alreadyComplete++;
        continue;
      }

      if (!dryRun) {
        await ctx.db.patch(cp._id, { documents: docRefs });
      }
      updated++;
    }

    return {
      totalProfiles: allChildProfiles.length,
      updated,
      skipped,
      alreadyComplete,
      dryRun,
    };
  },
});

// Keep the old restoreChildDocs mutation
export const restoreChildDocs = mutation({
  args: {
    docs: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    let restoredCount = 0;

    for (const doc of args.docs) {
      const category = getCategoryForType(doc.type);

      await ctx.db.insert("documents", {
        ownerId: doc.ownerId,
        documentType: doc.type,
        category: category,
        status: doc.status,
        label: doc.fileName || doc.type,
        files: [
          {
            storageId: doc.storageId,
            filename: doc.fileName || doc.type,
            sizeBytes: doc.fileSize || 0,
            mimeType: doc.fileType || "application/octet-stream",
            uploadedAt: doc._creationTime,
          },
        ],
      });
      restoredCount++;
    }

    return restoredCount;
  },
});

function getCategoryForType(type: string): DocumentTypeCategory {
  if (
    type === "passport" ||
    type === "identity_card" ||
    type === "identity_photo" ||
    type === "consular_card"
  )
    return DocumentTypeCategory.Identity;
  if (type === "proof_of_address" || type === "residence_permit")
    return DocumentTypeCategory.Residence;
  if (
    type === "birth_certificate" ||
    type === "marriage_certificate" ||
    type === "family_booklet" ||
    type === "parental_authorization"
  )
    return DocumentTypeCategory.CivilStatus;
  return DocumentTypeCategory.Other;
}
