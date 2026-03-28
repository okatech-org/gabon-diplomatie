import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft, Loader2, Printer, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { DesignerPage as Designer } from "@/features/designer/designer-page";
import { SendToPrintDialog } from "@/features/print/send-to-print-dialog";
import { useOrg } from "@/components/org/org-provider";
import type { CardTemplate } from "@/lib/models/card-element";

export const Route = createFileRoute("/_app/designer/$designId")({
  component: DesignerEditorPage,
});

function DesignerEditorPage() {
  const { designId } = Route.useParams();
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const { data: design, isPending } = useAuthenticatedConvexQuery(
    api.functions.cardDesigns.getById,
    { designId: designId as Id<"cardDesigns"> },
  );

  const updateDesign = useMutation(api.functions.cardDesigns.update);

  // Track save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTemplateRef = useRef<CardTemplate | null>(null);

  // Convert Convex doc to CardTemplate for the designer
  const initialTemplate: CardTemplate | null = design
    ? {
        id: design._id,
        name: design.name,
        createdAt: new Date(design._creationTime).toISOString(),
        updatedAt: new Date(design.updatedAt).toISOString(),
        backgroundColor: design.backgroundColor,
        frontBackgroundImage: design.frontBackgroundImage,
        backBackgroundImage: design.backBackgroundImage,
        backgroundOpacity: design.backgroundOpacity,
        frontElements: design.frontElements as CardTemplate["frontElements"],
        backElements: design.backElements as CardTemplate["backElements"],
        printDuplex: design.printDuplex,
        magneticTracks: (design.magneticTracks as [string, string, string]) ?? [
          "",
          "",
          "",
        ],
      }
    : null;

  // Debounced auto-save
  const saveToConvex = useCallback(
    async (template: CardTemplate) => {
      if (!design) return;
      setIsSaving(true);
      try {
        await updateDesign({
          designId: design._id,
          name: template.name,
          backgroundColor: template.backgroundColor,
          frontBackgroundImage: template.frontBackgroundImage,
          backBackgroundImage: template.backBackgroundImage,
          backgroundOpacity: template.backgroundOpacity,
          frontElements: template.frontElements,
          backElements: template.backElements,
          printDuplex: template.printDuplex,
          magneticTracks: [...template.magneticTracks],
        });
        setLastSaved(new Date());
      } catch (err) {
        console.error("Failed to save card design:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [design, updateDesign],
  );

  const handleTemplateChange = useCallback(
    (template: CardTemplate) => {
      latestTemplateRef.current = template;
      // Debounce: save 1.5s after last change
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (latestTemplateRef.current) {
          saveToConvex(latestTemplateRef.current);
        }
      }, 1500);
    },
    [saveToConvex],
  );

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (latestTemplateRef.current) {
        saveToConvex(latestTemplateRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual save (Cmd+S)
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (latestTemplateRef.current) {
      saveToConvex(latestTemplateRef.current);
    }
  }, [saveToConvex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!design || !initialTemplate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Design introuvable</p>
        <Button variant="outline" onClick={() => navigate({ to: "/designer" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux designs
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/designer" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{design.name}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPrintDialog(true)}
        >
          <Printer className="h-4 w-4 mr-1.5" />
          Imprimer
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </>
          ) : lastSaved ? (
            <>
              <Save className="h-3 w-3" />
              Sauvegardé à{" "}
              {lastSaved.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          ) : (
            <>
              <Save className="h-3 w-3" />
              Auto-sauvegarde
            </>
          )}
        </div>
      </div>

      {/* Designer inside a Card */}
      <Card className="flex-1 min-h-0 overflow-hidden">
        <Designer
          template={initialTemplate}
          onTemplateChange={handleTemplateChange}
        />
      </Card>

      {activeOrgId && (
        <SendToPrintDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          designId={design._id}
          designName={design.name}
          designVersion={design.version}
          printDuplex={design.printDuplex}
          orgId={activeOrgId}
        />
      )}
    </div>
  );
}
