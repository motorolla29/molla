import { useEffect, useState } from 'react';

type OnlineStatus = {
  isOnline: boolean;
  hasResolved: boolean;
};

export function useOnlineStatus(): OnlineStatus {
  // null = ещё не знаем (SSR или первый рендер до эффекта)
  const [status, setStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const resolve = () => {
      setStatus(typeof navigator !== 'undefined' ? navigator.onLine : true);
    };

    resolve();

    const onOnline = () => setStatus(true);
    const onOffline = () => setStatus(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return {
    isOnline: status ?? true,
    hasResolved: status !== null,
  };
}

