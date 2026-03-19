import { AppShell } from "@/components/layout/AppShell";
import { useStudentStats } from "@/hooks/use-stats";
import { useDocuments } from "@/hooks/use-documents";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, Download } from "lucide-react";
import { useState } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { FileBadge } from "@/components/common/Badges";
import { Button } from "@/components/common/Button";
import { Link } from "wouter";
import { useDownloadDocument } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/common/PageLoader";

export default function StudentDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useStudentStats();
  // Students only see approved documents
  const { data: documents = [], isLoading: isDocumentsLoading } = useDocuments({ status: "Approved" });
  const downloadMutation = useDownloadDocument();
  const { toast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  if (isStatsLoading || isDocumentsLoading) {
    return (
      <AppShell requiredRole="Student">
        <PageLoader message="Loading student portal..." />
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

  const categories = [
    {
      name: "Project Resources",
      count: documents.filter((d) => d.category === "Project Resources").length,
    },
    {
      name: "Examination Records",
      count: documents.filter((d) => d.category === "Examination Records")
        .length,
    },
    {
      name: "Administrative",
      count: documents.filter((d) => d.category === "Administrative").length,
    },
    {
      name: "Academic Policy",
      count: documents.filter((d) => d.category === "Academic Policy").length,
    },
    {
      name: "Research Output",
      count: documents.filter((d) => d.category === "Research Output").length,
    },
  ];

  return (
    <AppShell requiredRole="Student">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            Student Access Portal
          </h1>
          <p className="text-muted-foreground">
            Browse and download approved departmental resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Available Documents"
            value={stats?.availableDocuments}
            icon={FileText}
            colorClass="bg-[#1A6BAF]"
          />
          <StatCard
            title="Recently Added"
            value={stats?.recentlyAdded}
            icon={Clock}
            colorClass="bg-[#C8A84B]"
          />
          <StatCard
            title="My Downloads"
            value={stats?.myDownloads}
            icon={Download}
            colorClass="bg-primary"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Recently Available Documents
            </h2>
            <Link
              href="/student/documents"
              className="text-sm font-medium text-accent hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {documents.slice(0, 4).map((doc) => (
              <Card
                key={doc.id}
                className="border-border hover:border-accent/50 hover:shadow-md transition-strict cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileBadge type={doc.fileType} />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {doc.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.uploadedByName} •{" "}
                          {doc.date
                            ? new Date(doc.date).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-accent text-accent hover:bg-accent hover:text-white shrink-0"
                    disabled={downloadMutation.isPending}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await downloadMutation.mutateAsync({
                          id: doc.id,
                          fallbackName: doc.fileName || doc.title,
                        });
                      } catch (error: any) {
                        toast({
                          title: "Download failed",
                          description:
                            error?.message || "Could not download the file.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Download className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Download</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-xl font-bold text-foreground">
            Document Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/student/documents?category=${encodeURIComponent(cat.name)}`}
              >
                <Card className="border-border hover-lift cursor-pointer bg-card hover:bg-accent/5">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {cat.count} documents
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
