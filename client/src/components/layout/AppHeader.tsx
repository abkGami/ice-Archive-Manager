import { useUser, useLogout } from "@/hooks/use-auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "../common/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export function AppHeader() {
  const { data: user } = useUser();
  const logout = useLogout();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-primary text-primary-foreground';
      case 'Lecturer': return 'bg-accent text-accent-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-foreground" />
        <div>
          <h2 className="text-lg font-bold text-primary hidden sm:block">AFIT Archive System</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground relative" title="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border border-card"></span>
        </Button>

        <div className="h-8 w-px bg-border mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-0 gap-2 hover:bg-transparent flex items-center">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-foreground leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarFallback className={`font-bold ${getRoleColor(user.role)}`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">ID: {user.uniqueId}</p>
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
              onClick={() => logout.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
