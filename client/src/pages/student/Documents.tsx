import { AppShell } from "@/components/layout/AppShell";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useState, useEffect } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search, Download, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/ui/card";
import { useDownloadDocument } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/common/PageLoader";

export default function StudentDocuments() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const downloadMutation = useDownloadDocument();
  const { toast } = useToast();

  // Pre-fill category from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setCategory(cat);
  }, []);

  const { data: documents = [], isLoading } = useDocuments({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    status: "Approved", // Forced constraint for students
  });

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const quickCards = documents.slice(0, 3);

  const handleDownload = async (doc: Document) => {
    try {
      await downloadMutation.mutateAsync({
        id: doc.id,
        fallbackName: doc.fileName || doc.title,
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error?.message || "Could not download the file.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppShell requiredRole="Student">
        <PageLoader message="Loading documents..." />
      </AppShell>
    );
  }

  return (
    <AppShell requiredRole="Student">
      <div className="space-y-6 flex flex-col h-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Browse Documents
          </h1>
          <Button
            variant="outline"
            disabled={!selectedDoc || downloadMutation.isPending}
            onClick={() => selectedDoc && handleDownload(selectedDoc)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Selected
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search available resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 focus-ring-strict"
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Project Resources">
                  Project Resources
                </SelectItem>
                <SelectItem value="Examination Records">
                  Examination Records
                </SelectItem>
                <SelectItem value="Administrative">Administrative</SelectItem>
                <SelectItem value="Academic Policy">Academic Policy</SelectItem>
                <SelectItem value="Research Output">Research Output</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {quickCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickCards.map((doc) => (
              <Card key={doc.id} className="border-border">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {doc.category}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={downloadMutation.isPending}
                    onClick={() => handleDownload(doc)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0">
          <DocumentTable
            documents={documents}
            onRowClick={setSelectedDoc}
            // NO approve or delete handlers passed = strictly view/download mode
          />
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
