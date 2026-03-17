import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

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

// Lecturer shares documents and upload view structure but with different routing contexts
// For simplicity, we reuse the components if possible, or define lightweight wrappers
function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/documents" component={AdminDocuments} />
      <Route path="/admin/upload" component={AdminUpload} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/approvals" component={PendingApprovalsPage} />
      <Route path="/admin/audit" component={AdminAudit} />
      {/* Lecturer Routes - Reusing admin views but AppShell protects role */}
      <Route path="/lecturer/dashboard" component={LecturerDashboard} />
      <Route path="/lecturer/documents" component={AdminDocuments} />{" "}
      {/* Reused, UI adapts via Role */}
      <Route path="/lecturer/upload" component={AdminUpload} /> {/* Reused */}
      {/* Student Routes */}
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/documents" component={StudentDocuments} />
      {/* Fallback */}
      <Route component={NotFound} />
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
