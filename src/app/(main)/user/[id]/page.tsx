'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Перенаправляем на активные объявления по умолчанию
  useEffect(() => {
    router.replace(`/user/${userId}/active`);
  }, [userId, router]);

  return null;
}
