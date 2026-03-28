import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@workspace/ui/components/sonner";
import AppConvexProvider from "@workspace/api/provider";
import I18nProvider from "@workspace/i18n/provider";
import { api } from "@convex/_generated/api";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <I18nProvider>
      <AppConvexProvider ensureUserMutation={api.functions.users.ensureUser}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Outlet />
          <Toaster richColors />
        </ThemeProvider>
      </AppConvexProvider>
    </I18nProvider>
  );
}
