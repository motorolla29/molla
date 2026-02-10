'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UserProfileSidebar from './components/user-profile-sidebar';
import UserProfileSkeleton from './components/user-profile-skeleton';
import UserAdsContent from './components/user-ads-content';
import ReviewsList from '@/components/reviews-list';
import ReviewFormModal from '@/components/review-form-modal/review-form-modal';
import ImageModal from '@/components/messenger/image-modal';
import { useAuthStore } from '@/store/useAuthStore';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  joinDate: string;
  phone?: string;
  email?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const status = params?.status as 'active' | 'archived';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adsCounts, setAdsCounts] = useState<{
    active: number;
    archived: number;
  } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0);
  const { isLoggedIn, user: authUser } = useAuthStore();

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
        // Загружаем профиль пользователя, счетчики объявлений и отзывы параллельно
        const [userResponse, activeResponse, archivedResponse, reviewsResponse] =
          await Promise.all([
            fetch(`/api/users/${userId}`),
            fetch(`/api/users/${userId}/ads?status=active&limit=1`),
            fetch(`/api/users/${userId}/ads?status=archived&limit=1`),
            fetch(`/api/reviews?sellerId=${userId}&page=1&limit=1`),
          ]);

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || 'Пользователь не найден');
        }

        const userData = await userResponse.json();

        // Получаем количество объявлений из пагинации
        const activeData = activeResponse.ok
          ? await activeResponse.json()
          : { pagination: { total: 0 } };
        const archivedData = archivedResponse.ok
          ? await archivedResponse.json()
          : { pagination: { total: 0 } };
        const reviewsData = reviewsResponse.ok
          ? await reviewsResponse.json()
          : { pagination: { totalCount: 0 } };

        setUser({
          ...userData,
          reviewsCount: reviewsData.pagination?.totalCount || 0,
        });
        setAdsCounts({
          active: activeData.pagination?.total || 0,
          archived: archivedData.pagination?.total || 0,
        });
      } catch (err: any) {
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
              <UserProfileSidebar
                user={user}
                onAvatarClick={() => setShowAvatarModal(true)}
              />
            </div>
          </div>

          {/* Правый блок с объявлениями */}
          <div className="flex-1 lg:max-w-[calc(100%-352px)]">
            <UserAdsContent
              userId={userId}
              currentStatus={status}
              adsCounts={adsCounts || undefined}
            />

            {/* Секция отзывов */}
            <div className="mt-8" data-reviews-section>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6 max-[400px]:flex-col max-[400px]:items-start max-[400px]:gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Отзывы</h2>
                  {isLoggedIn && authUser && Number(authUser.id) !== parseInt(userId) && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-500 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-violet-600 transition-colors"
                    >
                      <PencilSquareIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      Оставить отзыв
                    </button>
                  )}
                </div>
                <ReviewsList key={reviewsKey} sellerId={parseInt(userId)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно просмотра аватара */}
      <ImageModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        imageUrl={user.avatar || '765-default-avatar.png'}
        altText={user.name}
      />

      {/* Модальное окно создания отзыва */}
      <ReviewFormModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        sellerId={parseInt(userId)}
        sellerName={user.name}
        onReviewCreated={() => {
          setReviewsKey((prev) => prev + 1);
          // Обновляем количество отзывов
          setUser((prev) =>
            prev ? { ...prev, reviewsCount: prev.reviewsCount + 1 } : prev
          );
        }}
      />
    </div>
  );
}
