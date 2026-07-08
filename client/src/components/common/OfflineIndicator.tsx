import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function OfflineIndicator() {
  const { isOnline, wasOffline, isSlowNetwork } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (wasOffline && isOnline) {
      // When connection is restored, invalidate all queries to refetch fresh data
      console.log("Connection restored! Refreshing data...");
      queryClient.invalidateQueries();
    }
  }, [wasOffline, isOnline, queryClient]);

  // Show nothing when online with good connection and was never offline
  if (isOnline && !wasOffline && !isSlowNetwork) {
    return null;
  }

  // Show slow network warning
  if (isOnline && isSlowNetwork && !wasOffline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-[#D97706] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#D97706]/20 max-w-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">Slow Network</p>
            <p className="text-xs opacity-90">Loading may take longer than usual</p>
          </div>
        </div>
      </div>
    );
  }

  // Show reconnection success message briefly
  if (isOnline && wasOffline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-[#1A6B45] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#1A6B45]/20">
          <div className="relative">
            <Wifi className="h-5 w-5" />
            <RefreshCw className="h-3 w-3 absolute -top-1 -right-1 animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-sm">Back Online</p>
            <p className="text-xs opacity-90">Syncing latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Offline indicator
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#D97706] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#D97706]/20">
        <WifiOff className="h-5 w-5 animate-pulse" />
        <div>
          <p className="font-semibold text-sm">You're Offline</p>
          <p className="text-xs opacity-90">Showing cached data</p>
        </div>
      </div>
    </div>
  );
}
