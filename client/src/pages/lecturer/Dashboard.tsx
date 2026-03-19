import { AppShell } from "@/components/layout/AppShell";
import { useLecturerStats } from "@/hooks/use-stats";
import { useDocuments } from "@/hooks/use-documents";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useState } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { useUser } from "@/hooks/use-auth";
import { PageLoader } from "@/components/common/PageLoader";
import { useLocation } from "wouter";

export default function LecturerDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: isStatsLoading } = useLecturerStats();
  const { data: documents, isLoading: isDocumentsLoading } = useDocuments(); // All docs
  const { data: user, isLoading: isUserLoading } = useUser();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  if (isStatsLoading || isDocumentsLoading || isUserLoading) {
    return (
      <AppShell requiredRole="Lecturer">
        <PageLoader message="Loading lecturer dashboard..." />
      </AppShell>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, path }: any) => (
    <Card
      className="border-border shadow-sm hover-lift cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => setLocation(path)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setLocation(path);
        }
      }}
    >
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
    <AppShell requiredRole="Lecturer">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            Lecturer Portal
          </h1>
          <p className="text-muted-foreground">
            Manage your departmental uploads and access archives.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <StatCard
            title="My Uploads"
            value={stats?.myUploads}
            icon={Upload}
            colorClass="bg-[#1A6BAF]"
            path="/lecturer/documents?mine=1"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Recent Archive Additions
          </h2>
          {documents && (
            <DocumentTable
              documents={documents
                .filter((d) => d.status === "Approved")
                .slice(0, 8)}
              onRowClick={setSelectedDoc}
            />
          )}
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
