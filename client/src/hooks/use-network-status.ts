import { useState, useEffect } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setIsSlowNetwork(false);
      
      // Reset wasOffline after 3 seconds
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSlowNetwork(false);
    };

    // Detect slow network using Network Information API
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          // Effective types: slow-2g, 2g, 3g, 4g
          const slowTypes = ['slow-2g', '2g'];
          const effectiveType = connection.effectiveType;
          setIsSlowNetwork(slowTypes.includes(effectiveType));
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check connection speed initially and on change
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        checkConnectionSpeed();
        connection.addEventListener('change', checkConnectionSpeed);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', checkConnectionSpeed);
        }
      }
    };
  }, []);

  return { isOnline, wasOffline, isSlowNetwork };
}
