"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthenticatedPaginatedQuery } from "@/integrations/convex/hooks";
import { api } from "@convex/_generated/api";
import { DataTable } from "@/components/ui/data-table";
import { eventsColumns } from "@/components/admin/events-columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/events/")({
  component: AdminEventsPage,
});

function AdminEventsPage() {
  const { t } = useTranslation();

  const {
    results: events,
    isLoading: isPending,
    status: paginationStatus,
    loadMore,
  } = useAuthenticatedPaginatedQuery(
    api.functions.communityEvents.listAll,
    {},
    { initialNumItems: 30 },
  );

  const error = null; // paginated queries handle errors differently

  const filterableColumns = [
    {
      id: "category",
      title: "Catégorie",
      options: [
        { label: "Célébration", value: "celebration" },
        { label: "Culture", value: "culture" },
        { label: "Diplomatie", value: "diplomacy" },
        { label: "Sport", value: "sport" },
        { label: "Charité", value: "charity" },
      ],
    },
    {
      id: "status",
      title: "Statut",
      options: [
        { label: "Publié", value: "published" },
        { label: "Brouillon", value: "draft" },
        { label: "Archivé", value: "archived" },
      ],
    },
  ];

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
        <div className="text-destructive">
          {t("superadmin.common.error")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin.events.title")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "admin.events.description",
              "Gérez les événements de la communauté.",
            )}
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/events/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.events.create")}
          </Link>
        </Button>
      </div>

      <DataTable
        columns={eventsColumns}
        data={events ?? []}
        searchKey="title"
        searchPlaceholder={t(
          "admin.events.searchPlaceholder",
          "Rechercher un événement...",
        )}
        filterableColumns={filterableColumns}
        isLoading={isPending}
      />

      {paginationStatus === "CanLoadMore" && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => loadMore(30)}>
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
}
