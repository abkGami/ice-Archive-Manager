import { Document } from "@shared/schema";
import { format } from "date-fns";
import { FileBadge, StatusBadge } from "../common/Badges";
import { Button } from "../common/Button";
import { Eye, Download, CheckCircle, Trash2, FolderOpen } from "lucide-react";
import { EmptyState } from "../common/EmptyState";
import { useUser } from "@/hooks/use-auth";
import { useDownloadDocument } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";

interface DocumentTableProps {
  documents: Document[];
  onRowClick: (doc: Document) => void;
  onApprove?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

export function DocumentTable({
  documents,
  onRowClick,
  onApprove,
  onDelete,
}: DocumentTableProps) {
  const { data: user } = useUser();
  const downloadMutation = useDownloadDocument();
  const { toast } = useToast();
  const isAdmin = user?.role === "Administrator";
  const isStudent = user?.role === "Student";

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen} // Oops, need to import it. Let's just use generic SVG or pass from parent. Using inline here is fine but wait, better pass it.
        title="No documents found"
        description="Try adjusting your search or filters to find what you're looking for."
      />
    );
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-4 font-medium border-b border-border w-10"></th>
              <th className="px-4 py-4 font-medium border-b border-border min-w-[200px]">
                Document Title
              </th>
              <th className="px-4 py-4 font-medium border-b border-border">
                Category
              </th>
              <th className="px-4 py-4 font-medium border-b border-border hidden md:table-cell">
                Uploaded By
              </th>
              <th className="px-4 py-4 font-medium border-b border-border hidden lg:table-cell">
                Date
              </th>
              {!isStudent && (
                <th className="px-4 py-4 font-medium border-b border-border">
                  Status
                </th>
              )}
              <th className="px-4 py-4 font-medium border-b border-border text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => onRowClick(doc)}
              >
                <td className="px-4 py-3 align-middle">
                  <FileBadge type={doc.fileType} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="font-semibold text-foreground truncate max-w-[250px] md:max-w-[300px]">
                    {doc.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {doc.size}
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground whitespace-nowrap">
                    {doc.category}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle hidden md:table-cell text-muted-foreground whitespace-nowrap">
                  {doc.uploadedByName}
                </td>
                <td className="px-4 py-3 align-middle hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                  {doc.date ? format(new Date(doc.date), "MMM d, yyyy") : "-"}
                </td>
                {!isStudent && (
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <StatusBadge status={doc.status} />
                  </td>
                )}
                <td className="px-4 py-3 align-middle text-right">
                  <div
                    className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      title="View Details"
                      onClick={() => onRowClick(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Download"
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
                      <Download className="h-4 w-4" />
                    </Button>

                    {isAdmin &&
                      doc.status === "Pending Approval" &&
                      onApprove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                          title="Approve"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(doc);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                    {isAdmin && onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(doc);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
