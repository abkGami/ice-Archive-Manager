import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useUser } from "@/hooks/use-auth";
import { PageLoader } from "@/components/common/PageLoader";
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

function ProtectedRoute({
  component: Component,
}: {
  component: ComponentType;
}) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <PageLoader message="Validating session..." />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

// Lecturer shares documents and upload view structure but with different routing contexts
// For simplicity, we reuse the components if possible, or define lightweight wrappers
function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        component={() => <ProtectedRoute component={AdminDashboard} />}
      />
      <Route
        path="/admin/documents"
        component={() => <ProtectedRoute component={AdminDocuments} />}
      />
      <Route
        path="/admin/upload"
        component={() => <ProtectedRoute component={AdminUpload} />}
      />
      <Route
        path="/admin/users"
        component={() => <ProtectedRoute component={AdminUsers} />}
      />
      <Route
        path="/admin/approvals"
        component={() => <ProtectedRoute component={PendingApprovalsPage} />}
      />
      <Route
        path="/admin/audit"
        component={() => <ProtectedRoute component={AdminAudit} />}
      />
      {/* Lecturer Routes - Reusing admin views but AppShell protects role */}
      <Route
        path="/lecturer/dashboard"
        component={() => <ProtectedRoute component={LecturerDashboard} />}
      />
      <Route
        path="/lecturer/documents"
        component={() => <ProtectedRoute component={AdminDocuments} />}
      />{" "}
      {/* Reused, UI adapts via Role */}
      <Route
        path="/lecturer/upload"
        component={() => <ProtectedRoute component={AdminUpload} />}
      />{" "}
      {/* Reused */}
      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        component={() => <ProtectedRoute component={StudentDashboard} />}
      />
      <Route
        path="/student/documents"
        component={() => <ProtectedRoute component={StudentDocuments} />}
      />
      {/* Fallback */}
      <Route component={() => <ProtectedRoute component={NotFound} />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
