'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function OfflineIndicator() {
  const { isOnline, hasResolved } = useOnlineStatus();
  const pathname = usePathname();
  const [hasMobileNav, setHasMobileNav] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('mobile-bottom-nav');
    setHasMobileNav(Boolean(el));
  }, [pathname]);

  // На странице /offline отдельный экран, дополнительный индикатор не нужен.
  if (pathname === '/offline') return null;
  if (!hasResolved || isOnline) return null;

  const bottomClass = hasMobileNav ? 'bottom-16' : 'bottom-4';

  return (
    <div className={`fixed ${bottomClass} right-3 sm:right-4 max-w-3/4 z-40`}>
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
