import { useUser, useLogout } from "@/hooks/use-auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "../common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { usePendingUsers } from "@/hooks/use-users";
import { useDocuments } from "@/hooks/use-documents";
import { useEffect, useState } from "react";
import { SignOutConfirmDialog } from "@/components/common/SignOutConfirmDialog";

type HeaderNotification = {
  id: string;
  title: string;
  detail: string;
};

const VIEWED_NOTIFICATION_TTL_MS = 12 * 60 * 60 * 1000;

export function AppHeader() {
  const { data: user } = useUser();
  const logout = useLogout();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<
    Record<string, number>
  >({});

  const isAdmin = user?.role === "Administrator";
  const isStudent = user?.role === "Student";
  const isLecturer = user?.role === "Lecturer";

  const { data: pendingUsers = [] } = usePendingUsers({
    enabled: !!user && isAdmin,
  });
  const { data: pendingDocuments = [] } = useDocuments(
    { status: "Pending Approval" },
    { enabled: !!user && isAdmin },
  );
  const { data: accessibleDocuments = [] } = useDocuments(undefined, {
    enabled: !!user && (isStudent || isLecturer),
  });

  if (!user) return null;

  const viewedStorageKey = `viewed_notifications_${user.id}_${user.role}`;

  const sortedAccessibleDocs = [...accessibleDocuments].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  const recentStudentDocs = sortedAccessibleDocs.slice(0, 6);
  const recentLecturerAccessibleDocs = sortedAccessibleDocs
    .filter((doc) => doc.uploadedBy !== user.id)
    .slice(0, 4);
  const recentlyApprovedOwnDocs = sortedAccessibleDocs
    .filter((doc) => doc.uploadedBy === user.id && doc.status === "Approved")
    .slice(0, 4);

  const notifications: HeaderNotification[] = isAdmin
    ? [
        {
          id: `pending-users-${pendingUsers.length}`,
          title: "Pending Account Approvals",
          detail: `${pendingUsers.length} account request(s) awaiting review`,
        },
        {
          id: `pending-documents-${pendingDocuments.length}`,
          title: "Pending Document Approvals",
          detail: `${pendingDocuments.length} document(s) awaiting approval`,
        },
      ]
    : isStudent
      ? recentStudentDocs.map((doc) => ({
          id: `student-doc-${doc.id}`,
          title: "New document available",
          detail: `${doc.title} • ${doc.date ? format(new Date(doc.date), "MMM d") : "Recently"}`,
        }))
      : isLecturer
        ? [
            ...recentLecturerAccessibleDocs.map((doc) => ({
              id: `staff-doc-${doc.id}`,
              title: "New accessible document",
              detail: `${doc.title} • ${doc.date ? format(new Date(doc.date), "MMM d") : "Recently"}`,
            })),
            ...recentlyApprovedOwnDocs.map((doc) => ({
              id: `approved-own-${doc.id}`,
              title: "Your upload was approved",
              detail: `${doc.title} is now approved by admin`,
            })),
          ]
        : [];

  const activeNotifications = notifications.filter((item) => {
    const viewedAt = viewedNotifications[item.id];
    if (!viewedAt) return true;
    return Date.now() - viewedAt < VIEWED_NOTIFICATION_TTL_MS;
  });

  const unreadCount = activeNotifications.filter(
    (item) => !viewedNotifications[item.id],
  ).length;

  const initials = user.name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-primary text-primary-foreground";
      case "Lecturer":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  useEffect(() => {
    let ticking = false;

    const getScrollTop = () => {
      const container = document.getElementById("app-scroll-container");
      if (container) {
        return container.scrollTop;
      }
      return window.scrollY;
    };

    const updateScrollState = () => {
      setIsScrolled(getScrollTop() > 10);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    };

    const container = document.getElementById("app-scroll-container");
    if (container) {
      container.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    updateScrollState();

    return () => {
      if (container) {
        container.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(viewedStorageKey);
      const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
      setViewedNotifications(parsed);
    } catch {
      setViewedNotifications({});
    }
  }, [viewedStorageKey]);

  useEffect(() => {
    if (!isBellOpen || activeNotifications.length === 0) return;

    const now = Date.now();
    setViewedNotifications((previous) => {
      const next = { ...previous };
      let changed = false;

      activeNotifications.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = now;
          changed = true;
        }
      });

      if (!changed) {
        return previous;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(viewedStorageKey, JSON.stringify(next));
      }

      return next;
    });
  }, [activeNotifications, isBellOpen, viewedStorageKey]);

  return (
    <header
      className={`relative h-16 border-b flex items-center justify-between px-3 sm:px-4 lg:px-6 z-30 transition-[background-color,backdrop-filter,box-shadow] duration-300 ease-out ${
        isScrolled
          ? "bg-card/85 backdrop-blur-md border-border/80 shadow-[0_8px_30px_-20px_rgba(10,34,64,0.55)]"
          : "bg-card border-border"
      }`}
      style={{ position: "sticky", top: 0 }}
    >
      {isScrolled && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent animate-header-glow" />
      )}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-foreground" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-primary hidden sm:block truncate">
            ICT Department Archive System
          </h2>
          <h2 className="text-sm font-bold text-primary sm:hidden truncate max-w-[42vw]">
            ICT E-Archive
          </h2>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <DropdownMenu open={isBellOpen} onOpenChange={setIsBellOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1 flex items-center justify-center border border-card">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(20rem,90vw)]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activeNotifications.length === 0 ? (
              <DropdownMenuItem className="text-muted-foreground">
                No new notifications
              </DropdownMenuItem>
            ) : (
              activeNotifications.slice(0, 8).map((item) => (
                <DropdownMenuItem key={item.id} className="py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {item.detail}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-px bg-border mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="pl-2 pr-0 gap-2 hover:bg-transparent flex items-center"
            >
              <div className="text-right hidden md:block min-w-0 max-w-[220px]">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarFallback
                  className={`font-bold ${getRoleColor(user.role)}`}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(14rem,90vw)]">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  ID: {user.uniqueId.toUpperCase()}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => setIsSignOutDialogOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SignOutConfirmDialog
          open={isSignOutDialogOpen}
          onOpenChange={setIsSignOutDialogOpen}
          isPending={logout.isPending}
          onConfirm={() => {
            logout.mutate(undefined, {
              onSuccess: () => setIsSignOutDialogOpen(false),
            });
          }}
        />
      </div>
    </header>
  );
}
