import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, File, X } from "lucide-react";
import { useState, useRef } from "react";
import { useCreateDocument } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [allowStaffAccess, setAllowStaffAccess] = useState(true);
  const [allowStudentAccess, setAllowStudentAccess] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateDocument();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: user } = useUser();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !category) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const ext = file.name.split(".").pop() || "pdf";
    const fileData = await fileToDataUrl(file);

    createMutation.mutate(
      {
        title,
        category,
        description,
        fileType: ext,
        fileName: file.name,
        fileData,
        allowStaffAccess,
        allowStudentAccess,
        size: `${(file.size / (1024 * 1024)).toFixed(3)} MB`,
        uploadedBy: user?.id || 1,
        uploadedByName: user?.name || "Unknown",
        status:
          user?.role === "Administrator" ? "Approved" : "Pending Approval",
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description:
              user?.role === "Administrator"
                ? "Document uploaded and approved."
                : "Document uploaded successfully. Pending approval.",
            className: "bg-[#1A6B45] text-white border-transparent",
          });
          const basePath =
            user?.role === "Administrator" ? "/admin" : "/lecturer";
          setLocation(`${basePath}/documents`);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <AppShell requiredRole="any">
      {" "}
      {/* Both admin and lecturer use this */}
      <div className="max-w-2xl mx-auto py-4 sm:py-8">
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-border min-w-0">
            <div className="bg-accent/10 p-2 rounded-lg">
              <UploadCloud className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
              Upload New Document
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Document Title <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q4 Final Examination Results"
                className="focus-ring-strict"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="focus-ring-strict">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project Resources">
                    Project Resources
                  </SelectItem>
                  <SelectItem value="Examination Records">
                    Examination Records
                  </SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                  <SelectItem value="Academic Policy">
                    Academic Policy
                  </SelectItem>
                  <SelectItem value="Research Output">
                    Research Output
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief summary of this document's contents..."
                rows={4}
                className="resize-none focus-ring-strict"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
              <p className="text-sm font-semibold text-foreground">
                Access Control
              </p>
              <p className="text-xs text-muted-foreground">
                By default, uploaded documents are visible to staff and students
                (when approved).
              </p>
              <div className="flex items-start sm:items-center justify-between gap-3">
                <Label
                  htmlFor="allowStaffAccess"
                  className="text-sm text-foreground leading-snug"
                >
                  Allow other staff to view and download
                </Label>
                <Switch
                  id="allowStaffAccess"
                  checked={allowStaffAccess}
                  onCheckedChange={setAllowStaffAccess}
                />
              </div>
              <div className="flex items-start sm:items-center justify-between gap-3">
                <Label
                  htmlFor="allowStudentAccess"
                  className="text-sm text-foreground leading-snug"
                >
                  Allow students to view and download
                </Label>
                <Switch
                  id="allowStudentAccess"
                  checked={allowStudentAccess}
                  onCheckedChange={setAllowStudentAccess}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                File <span className="text-destructive">*</span>
              </Label>

              {!file ? (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 sm:p-10 text-center hover:bg-accent/5 hover:border-accent transition-colors cursor-pointer group"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-accent mx-auto mb-4 transition-colors" />
                  <p className="text-foreground font-semibold mb-1">
                    Drag and drop your file here
                  </p>
                  <p className="text-muted-foreground text-sm">
                    or click to browse from your computer
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Accepted: PDF, DOCX, XLSX (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary/10 p-2 rounded text-primary">
                      <File className="h-6 w-6" />
                    </div>
                    <div className="truncate pr-2 sm:pr-4 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(3)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !file || !title || !category || createMutation.isPending
                }
                isLoading={createMutation.isPending}
                className="w-full sm:w-auto"
              >
                Upload Document
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
