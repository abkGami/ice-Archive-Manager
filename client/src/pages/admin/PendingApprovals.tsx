import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApproveUser, usePendingUsers } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";
import { ShieldAlert } from "lucide-react";
import { PageLoader } from "@/components/common/PageLoader";

export default function PendingApprovalsPage() {
  const { data: pendingUsers = [], isLoading } = usePendingUsers();
  const approveMutation = useApproveUser();
  const { toast } = useToast();
  const [idCardUrls, setIdCardUrls] = useState<Record<number, string>>({});
  const [fullscreenCard, setFullscreenCard] = useState<{
    url: string;
    name: string;
  } | null>(null);

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
            Pending Account Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review student and staff requests before granting access.
          </p>
        </div>

        {isLoading ? (
          <PageLoader message="Loading pending approvals..." />
        ) : pendingUsers.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-6 sm:p-10 text-center">
              <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3" />
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
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {user.role}
                      </p>
                      <h3 className="font-bold text-foreground truncate max-w-[220px]" title={user.name}>{user.name}</h3>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-[#C8A84B]/15 text-[#7a621d]">
                      Pending
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">ID: </span>
                      <span className="font-medium text-foreground">
                        <span className="block max-w-[210px] truncate" title={user.uniqueId.toUpperCase()}>{user.uniqueId.toUpperCase()}</span>
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
                        className="w-full h-36 sm:h-44 object-cover rounded-md border border-border cursor-zoom-in"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                        onClick={() =>
                          setFullscreenCard({
                            url: idCardUrls[user.id],
                            name: user.name,
                          })
                        }
                      />
                    ) : (
                      <div className="w-full h-36 sm:h-44 rounded-md border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
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

      <Dialog
        open={!!fullscreenCard}
        onOpenChange={(open) => !open && setFullscreenCard(null)}
      >
        <DialogContent className="max-w-6xl w-[95vw] h-[92vh] p-3 bg-black/95 border-border">
          <DialogTitle className="sr-only">
            ID card fullscreen preview
          </DialogTitle>
          {fullscreenCard && (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={fullscreenCard.url}
                alt={`${fullscreenCard.name} ID card fullscreen`}
                className="max-w-full max-h-full object-contain rounded-md"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
