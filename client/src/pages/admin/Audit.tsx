import { AppShell } from "@/components/layout/AppShell";
import { useAuditLogs } from "@/hooks/use-audit";
import { format } from "date-fns";
import { Search, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/common/Button";
import { useState } from "react";
import { PageLoader } from "@/components/common/PageLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type Timeframe = "7d" | "30d" | "90d" | "custom" | "all";

function toCsvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function AdminAudit() {
  const { data: logs = [], isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [downloadAll, setDownloadAll] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [exportAction, setExportAction] = useState("all");
  const [exportSearch, setExportSearch] = useState("");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const { toast } = useToast();

  if (isLoading) {
    return (
      <AppShell requiredRole="Administrator">
        <PageLoader message="Loading audit trail..." />
      </AppShell>
    );
  }

  const sortedLogs = [...logs].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  const recentLogs = sortedLogs.slice(0, 20);

  const filteredLogs = recentLogs.filter(
    (log) =>
      (actionFilter === "all" || log.action === actionFilter) &&
      (log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.documentTitle &&
          log.documentTitle.toLowerCase().includes(search.toLowerCase()))),
  );

  const actionOptions = Array.from(
    new Set(sortedLogs.map((log) => log.action)),
  );

  const getExportLogs = () => {
    if (downloadAll) {
      return sortedLogs;
    }

    const now = Date.now();

    return sortedLogs.filter((log) => {
      const entryTime = log.date ? new Date(log.date).getTime() : NaN;

      if (timeframe !== "all") {
        if (Number.isNaN(entryTime)) return false;

        if (timeframe === "7d" && now - entryTime > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }

        if (timeframe === "30d" && now - entryTime > 30 * 24 * 60 * 60 * 1000) {
          return false;
        }

        if (timeframe === "90d" && now - entryTime > 90 * 24 * 60 * 60 * 1000) {
          return false;
        }

        if (timeframe === "custom") {
          if (!customFromDate || !customToDate) {
            return false;
          }

          const from = new Date(`${customFromDate}T00:00:00`).getTime();
          const to = new Date(`${customToDate}T23:59:59`).getTime();
          if (entryTime < from || entryTime > to) {
            return false;
          }
        }
      }

      if (exportAction !== "all" && log.action !== exportAction) {
        return false;
      }

      if (exportSearch.trim().length > 0) {
        const query = exportSearch.toLowerCase();
        const matchesQuery =
          log.userName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          (log.documentTitle || "").toLowerCase().includes(query);

        if (!matchesQuery) {
          return false;
        }
      }

      return true;
    });
  };

  const handleExport = () => {
    const exportLogs = getExportLogs();
    if (exportLogs.length === 0) {
      toast({
        title: "No data to export",
        description:
          "No audit records match the selected timeframe and filters.",
        variant: "destructive",
      });
      return;
    }

    const header = ["User", "Action", "Document", "Date"];
    const rows = exportLogs.map((log) => [
      log.userName || "",
      log.action || "",
      log.documentTitle || "",
      log.date ? format(new Date(log.date), "yyyy-MM-dd HH:mm:ss") : "",
    ]);

    const csv = [
      header.map(toCsvCell).join(","),
      ...rows.map((row) =>
        row.map((cell) => toCsvCell(String(cell))).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setIsExportOpen(false);
    toast({
      title: "Export complete",
      description: `${exportLogs.length} audit record(s) downloaded.`,
    });
  };

  return (
    <AppShell requiredRole="Administrator">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            System Audit Log
          </h1>
          <Button
            variant="outline"
            className="bg-card"
            onClick={() => setIsExportOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user, action, or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background focus-ring-strict"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionOptions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" className="w-full sm:w-auto" disabled>
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filteredLogs.length} of the most recent 20 audit records.
        </p>

        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-4 border-b border-border">User</th>
                  <th className="px-4 py-4 border-b border-border">Action</th>
                  <th className="px-4 py-4 border-b border-border">
                    Document Affected
                  </th>
                  <th className="px-4 py-4 border-b border-border text-right">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td
                      className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate"
                      title={log.userName}
                    >
                      {log.userName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          log.action === "Upload"
                            ? "bg-[#1A6BAF]/10 text-[#1A6BAF]"
                            : log.action === "Download"
                              ? "bg-primary/10 text-primary"
                              : log.action === "Approve"
                                ? "bg-[#1A6B45]/10 text-[#1A6B45]"
                                : log.action === "Delete"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-[#C8A84B]/10 text-[#C8A84B]"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-muted-foreground max-w-[200px] truncate"
                      title={log.documentTitle || "-"}
                    >
                      {log.documentTitle || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                      {log.date
                        ? format(new Date(log.date), "MMM d, yyyy HH:mm:ss")
                        : "-"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No audit logs matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Export Audit Report</DialogTitle>
            <DialogDescription>
              Choose a timeframe and filters for export, or select full audit
              download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-border p-3 bg-muted/20">
              <Checkbox
                id="download-all"
                checked={downloadAll}
                onCheckedChange={(checked) => setDownloadAll(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="download-all" className="font-semibold">
                  Download whole audit log
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exports every audit entry and ignores timeframe or filter
                  options.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select
                  value={timeframe}
                  onValueChange={(value) => setTimeframe(value as Timeframe)}
                  disabled={downloadAll}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action Filter</Label>
                <Select
                  value={exportAction}
                  onValueChange={setExportAction}
                  disabled={downloadAll}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionOptions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {timeframe === "custom" && !downloadAll && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-from">From</Label>
                  <Input
                    id="custom-from"
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-to">To</Label>
                  <Input
                    id="custom-to"
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="export-search">Keyword Filter</Label>
              <Input
                id="export-search"
                placeholder="Filter by user, action, or document title"
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
                disabled={downloadAll}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExportOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleExport}>
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
