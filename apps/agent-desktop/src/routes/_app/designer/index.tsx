import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Copy, Loader2, MoreVertical, PaintbrushVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { useOrg } from "@/components/org/org-provider";
import { CardPreview } from "@/features/designer/card-preview";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { createEmptyTemplate } from "@/lib/models/card-element";
import {
  PREDEFINED_TEMPLATES,
  type TemplateInfo,
} from "@/lib/models/predefined-templates";

export const Route = createFileRoute("/_app/designer/")(
  { component: DesignerGalleryPage },
);

function DesignerGalleryPage() {
  const { activeOrgId } = useOrg();
  const navigate = useNavigate();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newDesignName, setNewDesignName] = useState("Nouveau design");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);

  const createDesign = useMutation(api.functions.cardDesigns.create);
  const removeDesign = useMutation(api.functions.cardDesigns.remove);
  const duplicateDesign = useMutation(api.functions.cardDesigns.duplicate);

  const { data: designs, isPending } = useAuthenticatedConvexQuery(
    api.functions.cardDesigns.listByOrg,
    activeOrgId ? { orgId: activeOrgId } : "skip",
  );

  const handleCreateDesign = async (fromTemplate?: TemplateInfo) => {
    if (!activeOrgId) return;

    const template = fromTemplate?.template ?? createEmptyTemplate(newDesignName);

    const designId = await createDesign({
      name: fromTemplate ? fromTemplate.name : newDesignName,
      description: fromTemplate?.description,
      orgId: activeOrgId,
      backgroundColor: template.backgroundColor,
      frontBackgroundImage: template.frontBackgroundImage,
      backBackgroundImage: template.backBackgroundImage,
      backgroundOpacity: template.backgroundOpacity,
      frontElements: template.frontElements,
      backElements: template.backElements,
      printDuplex: template.printDuplex,
      magneticTracks: [...template.magneticTracks],
    });

    setShowNewDialog(false);
    setNewDesignName("Nouveau design");
    setSelectedTemplate(null);

    navigate({ to: "/designer/$designId", params: { designId } });
  };

  const handleDuplicate = async (designId: Id<"cardDesigns">) => {
    await duplicateDesign({ designId });
  };

  const handleDelete = async (designId: Id<"cardDesigns">) => {
    await removeDesign({ designId });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Designer de cartes
          </h1>
          <p className="text-sm text-muted-foreground">
            Créer et éditer des designs de cartes consulaires
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau design
        </Button>
      </div>

      {/* Designs saved on Convex */}
      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : designs && designs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((design) => (
            <DesignCard
              key={design._id}
              design={design}
              onOpen={() =>
                navigate({
                  to: "/designer/$designId",
                  params: { designId: design._id },
                })
              }
              onDuplicate={() => handleDuplicate(design._id)}
              onDelete={() => handleDelete(design._id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <PaintbrushVertical className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Aucun design</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Créez votre premier design de carte consulaire. Vous pouvez partir
            de zéro ou utiliser un template prédéfini.
          </p>
          <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un design
          </Button>
        </div>
      )}

      {/* New Design Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau design</DialogTitle>
            <DialogDescription>
              Partez de zéro ou choisissez un template prédéfini comme point de
              départ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Name input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du design</label>
              <Input
                value={newDesignName}
                onChange={(e) => setNewDesignName(e.target.value)}
                placeholder="Nom du design"
              />
            </div>

            {/* Blank design button */}
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => handleCreateDesign()}
            >
              <div className="h-10 w-14 rounded border bg-white flex items-center justify-center mr-3 shrink-0">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Design vierge</p>
                <p className="text-xs text-muted-foreground">
                  Canvas CR80 vide (85.6 × 54mm)
                </p>
              </div>
            </Button>

            {/* Predefined templates */}
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">
                Ou partir d'un template
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PREDEFINED_TEMPLATES.map((info) => (
                  <button
                    key={info.id}
                    type="button"
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                      selectedTemplate?.id === info.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => {
                      setSelectedTemplate(info);
                      setNewDesignName(info.name);
                    }}
                  >
                    <CardPreview
                      backgroundColor={info.template.backgroundColor}
                      backgroundOpacity={info.template.backgroundOpacity}
                      elements={info.template.frontElements}
                      height={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{info.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {info.description}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      {info.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Create from template button */}
            {selectedTemplate && (
              <Button
                className="w-full"
                onClick={() => handleCreateDesign(selectedTemplate)}
              >
                Créer depuis « {selectedTemplate.name} »
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design Card — shows a saved design in the gallery with real card preview
// ---------------------------------------------------------------------------

interface DesignFromQuery {
  _id: Id<"cardDesigns">;
  _creationTime: number;
  name: string;
  description?: string;
  backgroundColor: string;
  backgroundOpacity: number;
  frontElements: Array<Record<string, any>>;
  backElements: Array<Record<string, any>>;
  printDuplex: boolean;
  version: number;
  updatedAt: number;
  createdBy: Id<"users">;
}

function DesignCard({
  design,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  design: DesignFromQuery;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const updatedDate = new Date(design.updatedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group cursor-pointer" onClick={onOpen}>
      {/* Card preview = the design itself, full width */}
      <div className="relative">
        <CardPreview
          backgroundColor={design.backgroundColor}
          backgroundOpacity={design.backgroundOpacity}
          elements={design.frontElements as any}
          height={180}
          className="w-full!"
          fillWidth
        />
        {design.printDuplex && (
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
            Recto/verso
          </span>
        )}
      </div>

      {/* Info below the card */}
      <div className="flex items-start justify-between gap-2 mt-2.5 px-0.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{design.name}</p>
          {design.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {design.description}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Modifié le {updatedDate} · v{design.version}
          </p>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
