'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import UserProfileSidebar from './components/user-profile-sidebar';
import UserProfileSkeleton from './components/user-profile-skeleton';
import UserAdsContent from './components/user-ads-content';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  joinDate: string;
  phone?: string;
  email?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const status = params.status as 'active' | 'archived';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверяем валидность статуса
  useEffect(() => {
    if (status !== 'active' && status !== 'archived') {
      router.replace(`/user/${userId}/active`);
      return;
    }
  }, [status, userId, router]);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log('Client: Fetching user profile for ID:', userId);
        const response = await fetch(`/api/users/${userId}`);
        console.log('Client: Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Client: Error response:', errorData);
          throw new Error(errorData.error || 'Пользователь не найден');
        }

        const userData = await response.json();
        console.log('Client: User data received:', userData);
        setUser(userData);
      } catch (err: any) {
        console.log('Client: Error occurred:', err);
        setError(err.message || 'Не удалось загрузить профиль пользователя');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  if (error) {
    return (
      <div className="min-h-screen text-neutral-800 py-6 sm:py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-red-500 mb-4">
              Ошибка
            </h1>
            <p className="text-sm sm:text-base text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return <UserProfileSkeleton />;
  }

  return (
    <div className="min-h-screen text-neutral-800 py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Левый блок с информацией о пользователе */}
          <div className="w-full lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-23">
              <UserProfileSidebar user={user} />
            </div>
          </div>

          {/* Правый блок с объявлениями */}
          <div className="flex-1">
            <UserAdsContent userId={userId} currentStatus={status} />
          </div>
        </div>
      </div>
    </div>
  );
}
