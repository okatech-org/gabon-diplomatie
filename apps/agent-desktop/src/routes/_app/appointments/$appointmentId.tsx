import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/appointments/$appointmentId")({
  component: AppointmentDetailPage,
});

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Détail rendez-vous
        </h1>
        <p className="text-sm text-muted-foreground">
          Rendez-vous : {appointmentId}
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        Cette page sera bientôt disponible
      </div>
    </div>
  );
}
