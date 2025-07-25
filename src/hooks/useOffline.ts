import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast({
          title: "Back Online",
          description: "Connection restored. Syncing data...",
        });
        setWasOffline(false);
        // Trigger background sync
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            // @ts-ignore - Background sync is experimental
            if ('sync' in registration) {
              // @ts-ignore
              registration.sync.register('background-sync');
            }
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast({
        title: "You're Offline",
        description: "Some features may be limited. Changes will sync when reconnected.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, toast]);

  return { isOnline, wasOffline };
};