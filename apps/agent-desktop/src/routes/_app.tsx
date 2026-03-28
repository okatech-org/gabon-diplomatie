import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OrgProvider, useOrg } from "@/components/org/org-provider";
import { OrgSidebar } from "@/components/org/org-sidebar";
import {
  ConsularThemeContext,
  useConsularTheme,
  useConsularThemeState,
} from "@/hooks/useConsularTheme";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "admin-sidebar-expanded";

export const Route = createFileRoute("/_app")({
  component: DashboardLayoutWrapper,
});

function DashboardLayoutWrapper() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const navigate = useNavigate();
  const consularThemeValue = useConsularThemeState();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate({ to: "/sign-in" });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ConsularThemeContext.Provider value={consularThemeValue}>
      <OrgProvider>
        <DashboardLayout />
      </OrgProvider>
    </ConsularThemeContext.Provider>
  );
}

function DashboardLayout() {
  const { isLoading, activeOrg } = useOrg();
  const { t } = useTranslation();
  const { consularTheme } = useConsularTheme();

  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isExpanded));
    } catch {}
  }, [isExpanded]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t("dashboard.noAccess.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.noAccess.description")}
        </p>
        <p className="text-sm">{t("dashboard.noAccess.contact")}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden h-screen gap-6 flex bg-background",
        consularTheme === "homeomorphism" && "theme-homeomorphism",
      )}
    >
      <div className="p-6 pr-0!">
        <OrgSidebar
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((prev) => !prev)}
        />
      </div>
      <main className="flex-1 min-h-full overflow-y-auto -ml-6">
        <Outlet />
      </main>
    </div>
  );
}
