import { AppShell } from "@/components/layout/AppShell";
import { useLecturerStats } from "@/hooks/use-stats";
import { useDocuments } from "@/hooks/use-documents";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle, Archive } from "lucide-react";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useState } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { useUser } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/common/Badges";
import { PageLoader } from "@/components/common/PageLoader";

export default function LecturerDashboard() {
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

  const myUploads = documents?.filter((d) => d.uploadedBy === user?.id) || [];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="My Uploads"
            value={stats?.myUploads}
            icon={Upload}
            colorClass="bg-[#1A6BAF]"
          />
          <StatCard
            title="Approved Documents"
            value={stats?.approvedDocuments}
            icon={CheckCircle}
            colorClass="bg-[#1A6B45]"
          />
          <StatCard
            title="Total Archive Size"
            value={stats?.totalDocuments}
            icon={Archive}
            colorClass="bg-primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              Recent Archive Additions
            </h2>
            {documents && (
              <DocumentTable
                documents={documents
                  .filter((d) => d.status === "Approved")
                  .slice(0, 5)}
                onRowClick={setSelectedDoc}
              />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              My Recent Uploads
            </h2>
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {myUploads.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">
                          {doc.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <StatusBadge status={doc.status} />
                        <span className="text-xs text-muted-foreground">
                          {doc.date
                            ? new Date(doc.date).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                  {myUploads.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      You haven't uploaded any documents yet.
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
