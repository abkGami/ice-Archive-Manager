import { ReactNode } from "react";
import { useUser, useIsAuthenticated } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { PageLoader } from "@/components/common/PageLoader";

export interface RouteProtectionProps {
  children: ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export function RouteProtection({
  children,
  requiredRole,
  redirectTo = "/",
}: RouteProtectionProps) {
  const { data: user, isLoading } = useUser();
  const isAuthenticated = useIsAuthenticated();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <PageLoader message="Validating session..." />
      </div>
    );
  }

  // Redirect to home page if not authenticated
  if (!isAuthenticated || !user) {
    return <Redirect to={redirectTo} />;
  }

  // Check role-based access if required
  if (requiredRole && requiredRole !== "any") {
    if (user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      const userDashboard = getUserDashboardPath(user.role);
      return <Redirect to={userDashboard} />;
    }
  }

  return <>{children}</>;
}

export function ProtectedRoute({
  component: Component,
  requiredRole,
  redirectTo,
}: {
  component: React.ComponentType;
  requiredRole?: string;
  redirectTo?: string;
}) {
  return (
    <RouteProtection requiredRole={requiredRole} redirectTo={redirectTo}>
      <Component />
    </RouteProtection>
  );
}

function getUserDashboardPath(role: string): string {
  switch (role) {
    case "Administrator":
      return "/admin/dashboard";
    case "Lecturer":
      return "/lecturer/dashboard";
    case "Student":
      return "/student/dashboard";
    default:
      return "/";
  }
}

// Higher-order component for pages that require authentication
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteProtection requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </RouteProtection>
    );
  };
}