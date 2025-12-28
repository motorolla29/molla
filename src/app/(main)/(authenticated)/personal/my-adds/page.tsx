'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSkeleton from './[status]/components/loading-skeleton';

export default function MyAddsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/personal/my-adds/active');
  }, [router]);

  return <LoadingSkeleton />;
}
