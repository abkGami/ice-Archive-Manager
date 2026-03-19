import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Users,
  ClipboardList,
  UserCheck,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { data: user } = useUser();
  const [location] = useLocation();
  const logout = useLogout();

  if (!user) return null;

  const basePath =
    user.role === "Administrator"
      ? "/admin"
      : user.role === "Lecturer"
        ? "/lecturer"
        : "/student";

  const mainLinks = [
    { title: "Dashboard", url: `${basePath}/dashboard`, icon: LayoutDashboard },
    {
      title: user.role === "Student" ? "Browse Documents" : "Documents",
      url: `${basePath}/documents`,
      icon: FolderOpen,
    },
  ];

  if (user.role !== "Student") {
    mainLinks.push({
      title: "Upload Document",
      url: `${basePath}/upload`,
      icon: Upload,
    });
  }

  const adminLinks =
    user.role === "Administrator"
      ? [
          {
            title: "Pending Approvals",
            url: "/admin/approvals",
            icon: UserCheck,
          },
          { title: "User Management", url: "/admin/users", icon: Users },
          { title: "Audit Log", url: "/admin/audit", icon: ClipboardList },
        ]
      : [];

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <img
          src="/logo.png"
          alt="E-Archive Logo"
          className="h-12 w-12 sm:h-12 sm:w-12 object-contain mr-3 shrink-0"
        />
        <span className="text-lg font-bold text-primary font-display truncate">
          E-Archive
        </span>
      </div>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainLinks.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.url}
                        title={item.title}
                        className={
                          isActive
                            ? "text-accent font-medium bg-sidebar-accent border-l-2 border-accent min-w-0"
                            : "text-sidebar-foreground hover:text-accent transition-colors min-w-0"
                        }
                      >
                        <item.icon
                          className={
                            isActive ? "text-accent" : "text-muted-foreground"
                          }
                        />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminLinks.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminLinks.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link
                          href={item.url}
                          title={item.title}
                          className={
                            isActive
                              ? "text-accent font-medium bg-sidebar-accent border-l-2 border-accent min-w-0"
                              : "text-sidebar-foreground hover:text-accent transition-colors min-w-0"
                          }
                        >
                          <item.icon
                            className={
                              isActive ? "text-accent" : "text-muted-foreground"
                            }
                          />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout.mutate()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
