'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function OfflineIndicator() {
  const { isOnline, hasResolved } = useOnlineStatus();
  const pathname = usePathname();

  // На странице /offline отдельный экран, дополнительный индикатор не нужен.
  if (pathname === '/offline') return null;
  if (!hasResolved || isOnline) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 right-3 sm:right-4 max-w-3/4 z-60">
      <div className="inline-flex items-center gap-2 rounded-full bg-red-500/75 text-white px-3 py-2 shadow-lg">
        <div className="flex shrink-0 h-7 w-7 items-center justify-center rounded-full bg-red-500">
          <WifiOff className="w-4 h-4 text-white" />
        </div>
        <p className="text-xs sm:text-sm font-medium">
          Нет сети, данные могут быть устаревшими
        </p>
      </div>
    </div>
  );
}
