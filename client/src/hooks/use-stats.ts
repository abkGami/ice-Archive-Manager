import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAdminStats() {
  return useQuery({
    queryKey: [api.stats.admin.path],
    queryFn: async () => {
      const res = await fetch(api.stats.admin.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return api.stats.admin.responses[200].parse(await res.json());
    },
  });
}

export function useLecturerStats() {
  return useQuery({
    queryKey: [api.stats.lecturer.path],
    queryFn: async () => {
      const res = await fetch(api.stats.lecturer.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lecturer stats");
      return api.stats.lecturer.responses[200].parse(await res.json());
    },
  });
}

export function useStudentStats() {
  return useQuery({
    queryKey: [api.stats.student.path],
    queryFn: async () => {
      const res = await fetch(api.stats.student.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch student stats");
      return api.stats.student.responses[200].parse(await res.json());
    },
  });
}
