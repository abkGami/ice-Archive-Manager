import { AppShell } from "@/components/layout/AppShell";
import { useAdminStats } from "@/hooks/use-stats";
import { useDocuments } from "@/hooks/use-documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock, AlertCircle } from "lucide-react";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useState } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { format } from "date-fns";
import { useAuditLogs as useRealAuditLogs } from "@/hooks/use-audit"; // correct hook
import { PageLoader } from "@/components/common/PageLoader";

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useAdminStats();
  const { data: documents, isLoading: isDocumentsLoading } = useDocuments({
    status: "Pending Approval",
  }); // Show pending first or recent
  const { data: auditLogs, isLoading: isAuditLoading } = useRealAuditLogs();

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  if (isStatsLoading || isDocumentsLoading || isAuditLoading) {
    return (
      <AppShell requiredRole="Administrator">
        <PageLoader message="Loading dashboard insights..." />
      </AppShell>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card className="border-border shadow-sm hover-lift">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-md ${colorClass}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">{value || 0}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppShell requiredRole="Administrator">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            Administrator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of system activity and pending actions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Documents"
            value={stats?.totalDocuments}
            icon={FileText}
            colorClass="bg-primary"
          />
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals}
            icon={AlertCircle}
            colorClass="bg-[#D97706]"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers}
            icon={Users}
            colorClass="bg-[#1A6BAF]"
          />
          <StatCard
            title="Recent Uploads (7d)"
            value={stats?.recentUploads}
            icon={Clock}
            colorClass="bg-[#1A6B45]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Recent Documents
              </h2>
            </div>
            {documents && (
              <DocumentTable
                documents={documents.slice(0, 5)}
                onRowClick={setSelectedDoc}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Recent Activity
              </h2>
            </div>
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {auditLogs?.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-4 flex gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          log.action === "Upload"
                            ? "bg-[#1A6BAF]"
                            : log.action === "Download"
                              ? "bg-primary"
                              : log.action === "Approve"
                                ? "bg-[#1A6B45]"
                                : log.action === "Delete"
                                  ? "bg-destructive"
                                  : "bg-[#C8A84B]"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {log.userName} {log.action.toLowerCase()}ed{" "}
                          {log.documentTitle
                            ? `"${log.documentTitle}"`
                            : "system access"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.date
                            ? format(
                                new Date(log.date),
                                "MMM d, yyyy 'at' h:mm a",
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No recent activity.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DocumentDrawer
        document={selectedDoc}
        open={!!selectedDoc}
        onOpenChange={(open) => !open && setSelectedDoc(null)}
      />
    </AppShell>
  );
}
