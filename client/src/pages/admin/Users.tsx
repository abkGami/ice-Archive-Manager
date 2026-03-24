import { AppShell } from "@/components/layout/AppShell";
import {
  useUsers,
  useCreateUser,
  useToggleUserStatus,
  useUpdateUserDetails,
  useDeleteUser,
} from "@/hooks/use-users";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { UserPlus, Edit, Check, X, Search } from "lucide-react";
import { RoleBadge } from "@/components/common/Badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser as useCurrentUser } from "@/hooks/use-auth";
import type { User } from "@shared/schema";
import { PageLoader } from "@/components/common/PageLoader";

export default function AdminUsers() {
  const { data: users = [], isLoading } = useUsers();
  const { data: currentUser } = useCurrentUser();
  const createMutation = useCreateUser();
  const toggleMutation = useToggleUserStatus();
  const updateMutation = useUpdateUserDetails();
  const deleteMutation = useDeleteUser();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    uniqueId: "",
    role: "Student",
    department: "",
    password: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "Student",
    department: "",
  });

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      u.name.toLowerCase().includes(q) ||
      u.uniqueId.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.status.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <AppShell requiredRole="Administrator">
        <PageLoader message="Loading user accounts..." />
      </AppShell>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData({
          name: "",
          uniqueId: "",
          role: "Student",
          department: "",
          password: "",
        });
        toast({
          title: "User created",
          description: "Account has been provisioned successfully.",
        });
      },
    });
  };

  const handleToggle = (id: number, currentStatus: string) => {
    setPendingToggleId(id);
    toggleMutation.mutate(
      {
        id,
        status: currentStatus === "Active" ? "Inactive" : "Active",
      },
      {
        onSuccess: () => {
          toast({
            title: "User updated",
            description:
              currentStatus === "Active"
                ? "Account has been deactivated."
                : "Account has been activated.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Update failed",
            description: error?.message || "Unable to change account status.",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setPendingToggleId(null);
        },
      },
    );
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      role: user.role,
      department: user.department,
    });
    setIsEditOpen(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateMutation.mutate(
      {
        id: editingUser.id,
        updates: {
          name: editFormData.name,
          role: editFormData.role,
          department: editFormData.department,
          level: null,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "User details updated",
            description: "Changes have been saved successfully.",
          });
          setIsEditOpen(false);
          setEditingUser(null);
        },
        onError: (error: any) => {
          toast({
            title: "Update failed",
            description: error?.message || "Could not update this user.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDeleteUser = () => {
    if (!editingUser) return;

    deleteMutation.mutate(editingUser.id, {
      onSuccess: () => {
        toast({
          title: "User deleted",
          description: "The account has been removed successfully.",
        });
        setIsEditOpen(false);
        setEditingUser(null);
      },
      onError: (error: any) => {
        toast({
          title: "Delete failed",
          description: error?.message || "Could not delete this user.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AppShell requiredRole="Administrator">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            User Management
          </h1>
          {/* <Button onClick={() => setIsAddOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New User
          </Button> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex items-center justify-between">
            <span className="text-muted-foreground font-medium text-sm sm:text-base">
              Total Users
            </span>
            <span className="text-2xl font-bold text-foreground">
              {users.length}
            </span>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex items-center justify-between">
            <span className="text-muted-foreground font-medium text-sm sm:text-base">
              Lecturers
            </span>
            <span className="text-2xl font-bold text-accent">
              {users.filter((u) => u.role === "Lecturer").length}
            </span>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex items-center justify-between">
            <span className="text-muted-foreground font-medium text-sm sm:text-base">
              Students
            </span>
            <span className="text-2xl font-bold text-primary">
              {users.filter((u) => u.role === "Student").length}
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, unique ID, role..."
            className="pl-9"
          />
        </div>

        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-4 border-b border-border">User</th>
                  <th className="px-4 py-4 border-b border-border">
                    Unique ID
                  </th>
                  <th className="px-4 py-4 border-b border-border">Role</th>
                  <th className="px-4 py-4 border-b border-border">Status</th>
                  <th className="px-4 py-4 border-b border-border text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                            {u.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground truncate max-w-[210px]">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {u.uniqueId.toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${u.status === "Active" ? "bg-[#1A6B45]" : "bg-destructive"}`}
                        />
                        <span className="text-xs font-medium">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => openEditDialog(u)}
                          title="Edit user details"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${u.status === "Active" ? "text-destructive hover:bg-destructive/10" : "text-[#1A6B45] hover:bg-[#1A6B45]/10"}`}
                          onClick={() => handleToggle(u.id, u.status)}
                          disabled={
                            currentUser?.id === u.id ||
                            (pendingToggleId !== null &&
                              pendingToggleId !== u.id)
                          }
                          isLoading={
                            pendingToggleId === u.id && toggleMutation.isPending
                          }
                          title={
                            u.status === "Active" ? "Deactivate" : "Activate"
                          }
                        >
                          {u.status === "Active" ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No users match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unique ID</Label>
                <Input
                  required
                  value={formData.uniqueId}
                  onChange={(e) =>
                    setFormData({ ...formData, uniqueId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Lecturer">Lecturer</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unique ID</Label>
                <Input
                  value={(editingUser?.uniqueId || "").toUpperCase()}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(v) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      role: v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Lecturer">Lecturer</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                required
                value={editFormData.department}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    department: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteUser}
                isLoading={deleteMutation.isPending}
                disabled={currentUser?.id === editingUser?.id}
              >
                Delete User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
