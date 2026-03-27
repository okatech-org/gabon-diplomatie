import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthenticatedConvexQuery } from '@/integrations/convex/hooks'
import { api } from '@convex/_generated/api'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { columns } from '@/components/admin/orgs-columns'
import { ContinentTabs } from '@/components/shared/ContinentTabs'
import { getCountryFlag, getCountryName } from '@/lib/country-utils'
import { useMemo } from 'react'
import { OrganizationType } from '@convex/lib/constants'
import type { Doc } from '@convex/_generated/dataModel'

export const Route = createFileRoute('/dashboard/orgs/')({
  component: OrganizationsPage,
})

const ORG_TYPE_LABELS: Record<string, string> = {
  [OrganizationType.Embassy]: "🏛️ Ambassade",
  [OrganizationType.HighRepresentation]: "⭐ Haute Représentation",
  [OrganizationType.GeneralConsulate]: "🏢 Consulat Général",
  [OrganizationType.PermanentMission]: "🌍 Mission Permanente",
  [OrganizationType.HighCommission]: "👑 Haut-Commissariat",
  [OrganizationType.ThirdParty]: "🤝 Partenaire Tiers",
}

function OrganizationsPage() {
  const { t } = useTranslation()
  
  const { data: orgs, isPending, error } = useAuthenticatedConvexQuery(
    api.functions.admin.listOrgs,
    {}
  )

  // Get unique countries for dynamic filter
  const countryOptions = useMemo(() => {
    if (!orgs) return []
    const countries = new Map<string, string>()
    for (const org of orgs) {
      if (org.country && !countries.has(org.country)) {
        countries.set(org.country, `${getCountryFlag(org.country)} ${getCountryName(org.country)}`)
      }
    }
    return [...countries.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [orgs])

  // Type filter options (updated with current types)
  const typeOptions = useMemo(() => {
    if (!orgs) return []
    const types = new Set<string>()
    for (const org of orgs) {
      if (org.type) types.add(org.type)
    }
    return [...types].map((type) => ({
      value: type,
      label: ORG_TYPE_LABELS[type] || type,
    }))
  }, [orgs])

  const filterableColumns = [
    {
      id: "type",
      title: "Tous les types",
      options: typeOptions,
    },
    {
      id: "country",
      title: "Tous les pays",
      options: countryOptions,
    },
    {
      id: "isActive",
      title: t("superadmin.users.filters.allStatus"),
      options: [
        { label: t("superadmin.common.active"), value: "true" },
        { label: t("superadmin.common.inactive"), value: "false" },
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
            {t("superadmin.organizations.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("superadmin.organizations.description")}
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/orgs/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("superadmin.organizations.form.create")}
          </Link>
        </Button>
      </div>

      <ContinentTabs
        data={orgs ?? []}
        getCountryCode={(org: Doc<"orgs">) => org.country}
      >
        {(filteredOrgs) => (
          <DataTable
            columns={columns}
            data={filteredOrgs}
            searchKeys={["name", "slug", "address", "contact"]}
            searchPlaceholder={t("superadmin.organizations.filters.searchPlaceholder")}
            filterableColumns={filterableColumns}
            isLoading={isPending}
          />
        )}
      </ContinentTabs>
    </div>
  )
}
