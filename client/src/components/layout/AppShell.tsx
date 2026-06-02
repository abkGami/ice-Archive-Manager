import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ReactNode } from "react";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";

export function AppShell({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: string;
}) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground font-medium">
            Loading Institutional Data...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole && requiredRole !== "any") {
    // Basic redirect if they try to access wrong dashboard
    const redirectPath =
      user.role === "Administrator"
        ? "/admin/dashboard"
        : user.role === "Lecturer"
          ? "/lecturer/dashboard"
          : "/student/dashboard";
    return <Redirect to={redirectPath} />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full bg-background overflow-hidden animate-in fade-in duration-300">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <AppHeader />
          <main
            id="app-scroll-container"
            className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 lg:p-6"
          >
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
      <OfflineIndicator />
    </SidebarProvider>
  );
}
