import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/consular-registry/print-queue")({
  component: RegistryPrintQueuePage,
});

function RegistryPrintQueuePage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          File d'impression registre
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérer les impressions du registre consulaire
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        Cette page sera bientôt disponible
      </div>
    </div>
  );
}
