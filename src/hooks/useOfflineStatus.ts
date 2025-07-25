import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  // Initialize with true as default to avoid SSR issues
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial online status after component mounts
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return isOnline;
};