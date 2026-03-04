import { AppShell } from "@/components/layout/AppShell";
import { useDocuments, useApproveDocument, useDeleteDocument } from "@/hooks/use-documents";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useState } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search, Plus, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog } from "@/components/documents/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminDocuments() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  
  const { data: documents = [], isLoading } = useDocuments({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
  });

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  
  const approveMutation = useApproveDocument();
  const deleteMutation = useDeleteDocument();
  const { toast } = useToast();

  const handleApprove = (doc: Document) => {
    approveMutation.mutate(doc.id, {
      onSuccess: () => {
        toast({ title: "Document Approved", description: `"${doc.title}" has been approved.`, variant: "default" });
      }
    });
  };

  const confirmDelete = () => {
    if (!docToDelete) return;
    deleteMutation.mutate(docToDelete.id, {
      onSuccess: () => {
        toast({ title: "Document Deleted", description: "The document was permanently removed.", variant: "destructive" });
        setDocToDelete(null);
      }
    });
  };

  return (
    <AppShell requiredRole="Administrator">
      <div className="space-y-6 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Document Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="bg-background">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="secondary" size="icon" className="bg-muted">
              <List className="h-4 w-4 text-foreground" />
            </Button>
            <Link href="/admin/upload">
              <Button className="ml-2">
                <Plus className="mr-2 h-4 w-4" /> Upload
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title, category..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 focus-ring-strict"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Project Resources">Project Resources</SelectItem>
                <SelectItem value="Examination Records">Examination Records</SelectItem>
                <SelectItem value="Administrative">Administrative</SelectItem>
                <SelectItem value="Academic Policy">Academic Policy</SelectItem>
                <SelectItem value="Research Output">Research Output</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <DocumentTable 
            documents={documents} 
            onRowClick={setSelectedDoc}
            onApprove={handleApprove}
            onDelete={setDocToDelete}
          />
        </div>
        
        <div className="text-right text-sm text-muted-foreground">
          Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      <DocumentDrawer 
        document={selectedDoc} 
        open={!!selectedDoc} 
        onOpenChange={(open) => !open && setSelectedDoc(null)} 
        onApprove={(id) => handleApprove(selectedDoc!)}
        onDelete={(id) => setDocToDelete(selectedDoc)}
      />

      <ConfirmActionDialog
        open={!!docToDelete}
        onOpenChange={(open) => !open && setDocToDelete(null)}
        title="Delete Document"
        description={`Are you sure you want to delete "${docToDelete?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        isDestructive={true}
        isPending={deleteMutation.isPending}
      />
    </AppShell>
  );
}
