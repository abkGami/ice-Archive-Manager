import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { Document } from "@shared/schema";
import { FileBadge, StatusBadge } from "../common/Badges";
import { Button } from "../common/Button";
import {
  Eye,
  Download,
  CheckCircle,
  Trash2,
  User,
  Calendar,
  HardDrive,
  Tag,
} from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import {
  useDownloadDocument,
  useUpdateDocumentVisibility,
  useViewDocument,
} from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

function formatDisplaySize(size: string) {
  const match = size.match(/([\d.]+)\s*([a-zA-Z]+)/);
  if (!match) return size;

  const value = Number(match[1]);
  if (Number.isNaN(value)) return size;

  return `${value.toFixed(3)} ${match[2].toUpperCase()}`;
}

interface DocumentDrawerProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function DocumentDrawer({
  document,
  open,
  onOpenChange,
  onApprove,
  onDelete,
}: DocumentDrawerProps) {
  const { data: user } = useUser();
  const downloadMutation = useDownloadDocument();
  const viewMutation = useViewDocument();
  const updateVisibilityMutation = useUpdateDocumentVisibility();
  const { toast } = useToast();
  const isAdmin = user?.role === "Administrator";

  const [allowStaffAccess, setAllowStaffAccess] = useState(
    document?.allowStaffAccess ?? true,
  );
  const [allowStudentAccess, setAllowStudentAccess] = useState(
    document?.allowStudentAccess ?? true,
  );

  useEffect(() => {
    if (!document) return;
    setAllowStaffAccess(document.allowStaffAccess);
    setAllowStudentAccess(document.allowStudentAccess);
  }, [document]);

  if (!document) return null;

  const canViewDocument =
    document.fileType.replace(".", "").toLowerCase() === "pdf";
  const canManageVisibility =
    !!user &&
    (isAdmin || (user.role === "Lecturer" && document.uploadedBy === user.id));

  const visibilityChanged =
    allowStaffAccess !== document.allowStaffAccess ||
    allowStudentAccess !== document.allowStudentAccess;

  const handleSaveVisibility = async () => {
    try {
      await updateVisibilityMutation.mutateAsync({
        id: document.id,
        allowStaffAccess,
        allowStudentAccess,
      });

      toast({
        title: "Visibility updated",
        description: "Document visibility settings have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update document visibility.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-l border-border bg-card p-0 flex flex-col">
        <SheetHeader className="p-4 sm:p-6 border-b border-border text-left relative">
          <div className="flex items-start gap-3 sm:gap-4 pr-8 min-w-0">
            <FileBadge type={document.fileType} />
            <div className="min-w-0">
              <SheetTitle className="text-lg sm:text-xl font-bold leading-tight mb-2 text-foreground break-words">
                {document.title}
              </SheetTitle>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground max-w-[190px] truncate">
                  {document.category}
                </span>
                {user?.role !== "Student" && (
                  <StatusBadge status={document.status} />
                )}
              </div>
            </div>
          </div>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-4">
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
                Metadata
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Uploaded By
                  </div>
                  <div className="font-medium text-foreground break-words">
                    {document.uploadedByName}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date Added
                  </div>
                  <div className="font-medium text-foreground">
                    {document.date
                      ? format(new Date(document.date), "MMM d, yyyy")
                      : "Unknown"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" /> File Size
                  </div>
                  <div className="font-medium text-foreground">
                    {formatDisplaySize(document.size)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Format
                  </div>
                  <div className="font-medium text-foreground uppercase">
                    {document.fileType.replace(".", "")}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {document.description ||
                  "No description provided for this document."}
              </p>
            </div>

            {canManageVisibility && (
              <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Visibility
                </h4>

                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="allow-staff-access"
                    className="text-sm text-foreground"
                  >
                    Allow other staff to view and download
                  </Label>
                  <Switch
                    id="allow-staff-access"
                    checked={allowStaffAccess}
                    onCheckedChange={setAllowStaffAccess}
                    disabled={updateVisibilityMutation.isPending}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="allow-student-access"
                    className="text-sm text-foreground"
                  >
                    Allow students to view and download
                  </Label>
                  <Switch
                    id="allow-student-access"
                    checked={allowStudentAccess}
                    onCheckedChange={setAllowStudentAccess}
                    disabled={updateVisibilityMutation.isPending}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={
                    !visibilityChanged || updateVisibilityMutation.isPending
                  }
                  isLoading={updateVisibilityMutation.isPending}
                  onClick={handleSaveVisibility}
                >
                  Save Visibility
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border bg-card space-y-3">
          {canViewDocument && (
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              disabled={viewMutation.isPending}
              onClick={async () => {
                try {
                  await viewMutation.mutateAsync({
                    id: document.id,
                    fallbackName: document.fileName || document.title,
                  });
                } catch (error: any) {
                  toast({
                    title: "View failed",
                    description: error?.message || "Could not open the file.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Eye className="mr-2 h-5 w-5" /> View Document
            </Button>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={downloadMutation.isPending || viewMutation.isPending}
            onClick={async () => {
              try {
                await downloadMutation.mutateAsync({
                  id: document.id,
                  fallbackName: document.fileName || document.title,
                });
              } catch (error: any) {
                toast({
                  title: "Download failed",
                  description: error?.message || "Could not download the file.",
                  variant: "destructive",
                });
              }
            }}
          >
            <Download className="mr-2 h-5 w-5" /> Download Document
          </Button>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              {document.status === "Pending Approval" && onApprove && (
                <Button
                  variant="success"
                  onClick={() => {
                    onApprove(document.id);
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 border-destructive/20 hover:text-destructive col-span-1"
                  onClick={() => {
                    onDelete(document.id);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
