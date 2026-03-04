import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type DocumentInput } from "@shared/routes";

export function useDocuments(params?: { category?: string; status?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set("category", params.category);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.search) queryParams.set("search", params.search);
  
  const queryString = queryParams.toString();
  const url = `${api.documents.list.path}${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [api.documents.list.path, params],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return api.documents.list.responses[200].parse(await res.json());
    },
  });
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: [api.documents.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.documents.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch document");
      return api.documents.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: DocumentInput) => {
      // Simulate network delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const res = await fetch(api.documents.create.path, {
        method: api.documents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.documents.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload document");
      }
      return api.documents.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.lecturer.path] });
    },
  });
}

export function useApproveDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.documents.approve.path, { id });
      const res = await fetch(url, {
        method: api.documents.approve.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to approve document");
      return api.documents.approve.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.documents.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.documents.delete.path, { id });
      const res = await fetch(url, {
        method: api.documents.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete document");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.lecturer.path] });
    },
  });
}
