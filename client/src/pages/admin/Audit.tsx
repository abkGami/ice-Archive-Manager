import { AppShell } from "@/components/layout/AppShell";
import { useAuditLogs } from "@/hooks/use-audit";
import { format } from "date-fns";
import { Search, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/common/Button";
import { useState } from "react";

function toCsvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function AdminAudit() {
  const { data: logs = [] } = useAuditLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter(
    (log) =>
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.documentTitle &&
        log.documentTitle.toLowerCase().includes(search.toLowerCase())),
  );

  const handleExport = () => {
    const header = ["User", "Action", "Document", "Date"];
    const rows = filteredLogs.map((log) => [
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
  };

  return (
    <AppShell requiredRole="Administrator">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            System Audit Log
          </h1>
          <Button variant="outline" className="bg-card" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user, action, or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background focus-ring-strict"
            />
          </div>
          <Button variant="secondary">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full text-sm text-left">
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
                  <td className="px-4 py-3 font-medium text-foreground">
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
    </AppShell>
  );
}
