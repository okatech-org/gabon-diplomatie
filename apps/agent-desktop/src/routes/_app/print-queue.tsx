import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/print-queue")({
  component: PrintQueuePage,
});

function PrintQueuePage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          File d'impression
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérer les impressions de cartes consulaires
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 space-y-4 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">
            Gestion des impressions de cartes
          </p>
          <p className="text-sm mt-2">
            Suivez et gérez la file d'attente d'impression des cartes
            consulaires. Visualisez le statut de chaque impression, relancez les
            impressions échouées, et configurez les imprimantes connectées.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-3 py-1">File d'attente</span>
          <span className="rounded-full border px-3 py-1">Statut en temps réel</span>
          <span className="rounded-full border px-3 py-1">Impression par lot</span>
          <span className="rounded-full border px-3 py-1">Configuration imprimantes</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Cette fonctionnalité sera bientôt disponible
        </p>
      </div>
    </div>
  );
}
