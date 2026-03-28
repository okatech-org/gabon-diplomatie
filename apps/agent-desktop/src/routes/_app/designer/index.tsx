import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/designer/")({
  component: DesignerPage,
});

function DesignerPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Designer de cartes
        </h1>
        <p className="text-sm text-muted-foreground">
          Créer et éditer des templates de cartes consulaires
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 space-y-4 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">
            Outil de conception de cartes consulaires
          </p>
          <p className="text-sm mt-2">
            Concevez visuellement vos templates de cartes consulaires avec un
            éditeur drag-and-drop. Personnalisez la disposition, les champs, et
            le style de vos cartes.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-3 py-1">Drag & Drop</span>
          <span className="rounded-full border px-3 py-1">Aperçu en temps réel</span>
          <span className="rounded-full border px-3 py-1">Export PDF</span>
          <span className="rounded-full border px-3 py-1">Templates personnalisés</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Cette fonctionnalité sera bientôt disponible
        </p>
      </div>
    </div>
  );
}
