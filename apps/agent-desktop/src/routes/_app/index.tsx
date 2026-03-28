import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  FileText,
  IdCard,
  Loader2,
  PaintbrushVertical,
  Printer,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOrg } from "@/components/org/org-provider";
import { Card, CardContent } from "@workspace/ui/components/card";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const { activeOrg, activeOrgId } = useOrg();

  const { data: stats, isPending } = useAuthenticatedConvexQuery(
    api.functions.admin.getDashboardStats,
    activeOrgId ? { orgId: activeOrgId } : "skip",
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {activeOrg?.name ?? "Dashboard"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenue sur votre espace de gestion consulaire
        </p>
      </div>

      {/* Quick stats */}
      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("admin.nav.requests")}
            value={(stats as any).totalRequests ?? 0}
            icon={FileText}
          />
          <StatCard
            label="En attente"
            value={(stats as any).pendingRequests ?? 0}
            icon={FileText}
            variant="warning"
          />
          <StatCard
            label={t("admin.nav.consularRegistry")}
            value={(stats as any).totalProfiles ?? 0}
            icon={IdCard}
          />
          <StatCard
            label={t("admin.nav.appointments")}
            value={(stats as any).totalAppointments ?? 0}
            icon={Calendar}
          />
        </div>
      ) : null}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            title={t("admin.nav.requests")}
            description="Voir les demandes en cours"
            icon={FileText}
            to="/requests"
          />
          <QuickAction
            title={t("admin.nav.consularRegistry")}
            description="Consulter les inscriptions"
            icon={IdCard}
            to="/consular-registry"
          />
          <QuickAction
            title="Designer de cartes"
            description="Créer et éditer des templates"
            icon={PaintbrushVertical}
            to="/designer"
          />
          <QuickAction
            title="File d'impression"
            description="Gérer les impressions en cours"
            icon={Printer}
            to="/print-queue"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              variant === "warning"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  description,
  icon: Icon,
  to,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
