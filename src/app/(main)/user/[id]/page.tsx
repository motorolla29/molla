'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AdBase } from '@/types/ad';
import UserProfileSidebar from './components/user-profile-sidebar';
import UserAdsTabs from './components/user-ads-tabs';
import UserProfileSkeleton from './components/user-profile-skeleton';

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
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Mock данные для демонстрации
        const mockUser: UserProfile = {
          id: userId,
          name: 'Алексей Петров',
          avatar: '765-default-avatar.png',
          rating: 4.8,
          joinDate: '2024-01-15',
          phone: '+7 (999) 123-45-67',
          email: 'alexey@example.com',
        };

        setUser(mockUser);
      } catch (err) {
        setError('Не удалось загрузить профиль пользователя');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-neutral-800 py-6 sm:py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
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
            <UserAdsTabs userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}
