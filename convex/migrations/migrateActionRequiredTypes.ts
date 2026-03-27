import { internalMutation } from "../_generated/server";

/**
 * Migration: Update actionRequired types in the new actionsRequired array
 * Old types: "documents", "info", "payment"
 * New types: "upload_document", "complete_info", "schedule_appointment", "make_payment", "confirm_info"
 *
 * Also migrates from old actionRequired (single object) to actionsRequired (array)
 */
export const migrateActionRequiredTypes = internalMutation({
  handler: async (ctx) => {
    const requests = await ctx.db.query("requests").collect();
    
    const typeMapping: Record<string, string> = {
      "documents": "upload_document",
      "info": "complete_info",
      "payment": "make_payment",
    };
    
    let migrated = 0;
    
    for (const request of requests) {
      const req = request as any;

      // Migrate legacy single actionRequired → actionsRequired array
      if (req.actionRequired && !req.actionsRequired) {
        const legacyAction = req.actionRequired;
        const mappedType = typeMapping[legacyAction.type] ?? legacyAction.type;
        await ctx.db.patch(request._id, {
          actionsRequired: [{
            id: crypto.randomUUID().slice(0, 12),
            ...legacyAction,
            type: mappedType,
          }],
          actionRequired: undefined,
        } as any);
        migrated++;
        continue;
      }

      // Migrate types within existing actionsRequired array
      if (req.actionsRequired?.length) {
        let changed = false;
        const updated = req.actionsRequired.map((action: any) => {
          if (typeMapping[action.type]) {
            changed = true;
            return { ...action, type: typeMapping[action.type] };
          }
          return action;
        });
        if (changed) {
          await ctx.db.patch(request._id, { actionsRequired: updated });
          migrated++;
        }
      }
    }
    
    return { migrated };
  },
});
