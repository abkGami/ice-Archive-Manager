import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/ui/card";
import { useApproveUser, usePendingUsers } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";
import { Loader2, ShieldAlert } from "lucide-react";

export default function PendingApprovalsPage() {
  const { data: pendingUsers = [], isLoading } = usePendingUsers();
  const approveMutation = useApproveUser();
  const { toast } = useToast();
  const [idCardUrls, setIdCardUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    const controllers: AbortController[] = [];
    const blobUrls: string[] = [];

    const load = async () => {
      const entries = await Promise.all(
        pendingUsers.map(async (user) => {
          const controller = new AbortController();
          controllers.push(controller);

          try {
            const url = buildUrl(api.users.idCardPreview.path, { id: user.id });
            const res = await fetch(url, {
              credentials: "include",
              signal: controller.signal,
            });
            if (!res.ok) {
              return [user.id, ""] as const;
            }

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push(blobUrl);
            return [user.id, blobUrl] as const;
          } catch {
            return [user.id, ""] as const;
          }
        }),
      );

      setIdCardUrls(Object.fromEntries(entries));
    };

    if (pendingUsers.length > 0) {
      load();
    } else {
      setIdCardUrls({});
    }

    return () => {
      controllers.forEach((c) => c.abort());
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingUsers]);

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync(userId);
      toast({
        title: "User approved",
        description: "The account is now active and can sign in.",
        className: "bg-[#1A6B45] text-white border-transparent",
      });
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error?.message || "Could not approve this account.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell requiredRole="Administrator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Pending Account Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review student and staff requests before granting access.
          </p>
        </div>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-10 text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground">
                No pending approvals
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                All account requests are currently reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {user.role}
                      </p>
                      <h3 className="font-bold text-foreground">{user.name}</h3>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-[#C8A84B]/15 text-[#7a621d]">
                      Pending
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">ID: </span>
                      <span className="font-medium text-foreground">
                        {user.uniqueId}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Current Level:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {user.level || "N/A"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      ID Card Preview
                    </p>
                    {idCardUrls[user.id] ? (
                      <img
                        src={idCardUrls[user.id]}
                        alt={`${user.name} ID card`}
                        className="w-full h-44 object-cover rounded-md border border-border"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-44 rounded-md border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
                        ID card not available
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    isLoading={approveMutation.isPending}
                    onClick={() => handleApprove(user.id)}
                  >
                    Approve Account
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
