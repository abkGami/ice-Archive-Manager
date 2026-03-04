import { AppShell } from "@/components/layout/AppShell";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useState, useEffect } from "react";
import { DocumentDrawer } from "@/components/documents/DocumentDrawer";
import { Document } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export default function StudentDocuments() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  
  // Pre-fill category from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setCategory(cat);
  }, []);
  
  const { data: documents = [] } = useDocuments({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    status: "Approved", // Forced constraint for students
  });

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  return (
    <AppShell requiredRole="Student">
      <div className="space-y-6 flex flex-col h-full">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Browse Documents</h1>

        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search available resources..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                <SelectItem value="Project Resources">Project Resources</SelectItem>
                <SelectItem value="Examination Records">Examination Records</SelectItem>
                <SelectItem value="Administrative">Administrative</SelectItem>
                <SelectItem value="Academic Policy">Academic Policy</SelectItem>
                <SelectItem value="Research Output">Research Output</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
