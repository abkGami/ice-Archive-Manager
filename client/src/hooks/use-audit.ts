import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { buildApiUrl } from "@/lib/api";
import { OfflineStorage } from "@/lib/offline-storage";
import { useNetworkStatus } from "./use-network-status";

export function useAuditLogs(options?: { enabled?: boolean }) {
  const { isOnline } = useNetworkStatus();
  
  return useQuery({
    queryKey: [api.auditLogs.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(buildApiUrl(api.auditLogs.list.path), {
          credentials: "include",
          signal: AbortSignal.timeout(10000),
        });
        
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        
        const data = api.auditLogs.list.responses[200].parse(await res.json());
        OfflineStorage.saveAuditLogs(data);
        
        return data;
      } catch (error) {
        console.log("Loading audit logs from cache due to network error");
        const cachedData = OfflineStorage.getAuditLogs();
        
        if (cachedData) {
          return cachedData;
        }
        
        throw error;
      }
    },
    enabled: options?.enabled ?? true,
    refetchInterval: isOnline ? 30000 : false,
    retry: isOnline ? 3 : 0,
    staleTime: isOnline ? 0 : Infinity,
  });
}
