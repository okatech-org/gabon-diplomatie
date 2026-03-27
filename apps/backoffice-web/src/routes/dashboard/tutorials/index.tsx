"use client";

import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { DataTable } from "@/components/ui/data-table";
import { tutorialsColumns } from "@/components/admin/tutorials-columns";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/tutorials/")({
  component: AdminTutorialsPage,
});

function AdminTutorialsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tutorials, isLoading } = useAuthenticatedConvexQuery(
    api.functions.tutorials.listAll,
    {},
  );

  const filtered = useMemo(() => {
    if (!tutorials) return [];
    if (!searchQuery.trim()) return tutorials;
    const q = searchQuery.toLowerCase();
    return tutorials.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [tutorials, searchQuery]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("superadmin.tutorials.title")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "superadmin.tutorials.description",
              "Gérer les guides et tutoriels de l'Académie",
            )}
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/tutorials/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("superadmin.tutorials.new")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={t("superadmin.tutorials.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ?
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      : <DataTable columns={tutorialsColumns} data={filtered} />}
    </div>
  );
}
