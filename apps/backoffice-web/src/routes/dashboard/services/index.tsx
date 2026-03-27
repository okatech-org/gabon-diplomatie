import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthenticatedConvexQuery } from '@/integrations/convex/hooks'
import { api } from '@convex/_generated/api'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/components/admin/services-columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/dashboard/services/')({
  component: ServicesPage,
})

function ServicesPage() {
  const { t } = useTranslation()
  
  const { data: services, isPending, error } = useAuthenticatedConvexQuery(
    api.functions.services.listCatalog,
    {}
  )

  const filterableColumns = [
    {
      id: "category",
      title: t("superadmin.services.filters.allCategories"),
      options: [
        { label: t("superadmin.services.categories.passport"), value: "passport" },
        { label: t("superadmin.services.categories.visa"), value: "visa" },
        { label: t("superadmin.services.categories.civil_status"), value: "civil_status" },
        { label: t("superadmin.services.categories.registration"), value: "registration" },
        { label: t("superadmin.services.categories.legalization"), value: "legalization" },
        { label: t("superadmin.services.categories.emergency"), value: "emergency" },
        { label: t("superadmin.services.categories.other"), value: "other" },
      ],
    },
  ]

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
        <div className="text-destructive">{t("superadmin.common.error")}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("superadmin.services.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("superadmin.services.description")}
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/services/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("superadmin.services.form.create")}
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={services ?? []}
        searchKey="name"
        searchPlaceholder={t("superadmin.services.filters.searchPlaceholder")}
        filterableColumns={filterableColumns}
        isLoading={isPending}
      />
    </div>
  )
}
