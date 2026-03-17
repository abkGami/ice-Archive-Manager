import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type UserInput } from "@shared/routes";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UserInput) => {
      const res = await fetch(api.users.create.path, {
        method: api.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.users.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create user");
      }
      return api.users.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update user status");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function usePendingUsers() {
  return useQuery({
    queryKey: [api.users.pending.path],
    queryFn: async () => {
      const res = await fetch(api.users.pending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending users");
      return api.users.pending.responses[200].parse(await res.json());
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.users.approve.path, { id });
      const res = await fetch(url, {
        method: api.users.approve.method,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          const error = api.users.approve.responses[404].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to approve user");
      }

      return api.users.approve.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.pending.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
    },
  });
}
