import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import NotFound from "@/pages/not-found";
import { useUser } from "@/hooks/use-auth";
import { PageLoader } from "@/components/common/PageLoader";
import { ProtectedRoute } from "@/components/auth/RouteProtection";
import type { ComponentType } from "react";

// Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminDocuments from "@/pages/admin/Documents";
import AdminUpload from "@/pages/admin/Upload";
import AdminUsers from "@/pages/admin/Users";
import AdminAudit from "@/pages/admin/Audit";
import PendingApprovalsPage from "@/pages/admin/PendingApprovals";

import LecturerDashboard from "@/pages/lecturer/Dashboard";
import StudentDashboard from "@/pages/student/Dashboard";
import StudentDocuments from "@/pages/student/Documents";

// Home page component that handles initial routing based on authentication
function HomePage() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <PageLoader message="Loading application..." />
      </div>
    );
  }

  // If user is authenticated, redirect to their dashboard
  if (user) {
    const dashboardPath =
      user.role === "Administrator"
        ? "/admin/dashboard"
        : user.role === "Lecturer"
          ? "/lecturer/dashboard"
          : "/student/dashboard";
    return <Redirect to={dashboardPath} />;
  }

  // If not authenticated, redirect to login
  return <Redirect to="/login" />;
}

// Lecturer shares documents and upload view structure but with different routing contexts
// For simplicity, we reuse the components if possible, or define lightweight wrappers
function Router() {
  return (
    <Switch>
      {/* Home route - handles authentication-based redirects */}
      <Route path="/" component={HomePage} />

      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Admin Routes - Protected */}
      <Route
        path="/admin/dashboard"
        component={() => (
          <ProtectedRoute
            component={AdminDashboard}
            requiredRole="Administrator"
          />
        )}
      />
      <Route
        path="/admin/documents"
        component={() => (
          <ProtectedRoute
            component={AdminDocuments}
            requiredRole="Administrator"
          />
        )}
      />
      <Route
        path="/admin/upload"
        component={() => (
          <ProtectedRoute
            component={AdminUpload}
            requiredRole="Administrator"
          />
        )}
      />
      <Route
        path="/admin/users"
        component={() => (
          <ProtectedRoute component={AdminUsers} requiredRole="Administrator" />
        )}
      />
      <Route
        path="/admin/approvals"
        component={() => (
          <ProtectedRoute
            component={PendingApprovalsPage}
            requiredRole="Administrator"
          />
        )}
      />
      <Route
        path="/admin/audit"
        component={() => (
          <ProtectedRoute component={AdminAudit} requiredRole="Administrator" />
        )}
      />

      {/* Lecturer Routes - Protected */}
      <Route
        path="/lecturer/dashboard"
        component={() => (
          <ProtectedRoute
            component={LecturerDashboard}
            requiredRole="Lecturer"
          />
        )}
      />
      <Route
        path="/lecturer/documents"
        component={() => (
          <ProtectedRoute component={AdminDocuments} requiredRole="Lecturer" />
        )}
      />
      <Route
        path="/lecturer/upload"
        component={() => (
          <ProtectedRoute component={AdminUpload} requiredRole="Lecturer" />
        )}
      />

      {/* Student Routes - Protected */}
      <Route
        path="/student/dashboard"
        component={() => (
          <ProtectedRoute component={StudentDashboard} requiredRole="Student" />
        )}
      />
      <Route
        path="/student/documents"
        component={() => (
          <ProtectedRoute component={StudentDocuments} requiredRole="Student" />
        )}
      />

      {/* Fallback for any unmatched routes */}
      <Route component={() => <ProtectedRoute component={NotFound} />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ice-archive-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
