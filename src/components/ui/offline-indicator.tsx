import { Wifi, WifiOff } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { Badge } from './badge';

export function OfflineIndicator() {
  const { isOnline } = useOffline();

  if (isOnline) {
    return (
      <Badge variant="secondary" className="gap-2">
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-2">
      <WifiOff className="h-3 w-3" />
      Offline
    </Badge>
  );
}