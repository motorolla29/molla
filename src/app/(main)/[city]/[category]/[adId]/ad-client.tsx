'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { AdBase } from '@/types/ad';
import { categoryOptions } from '@/const';
import { getCurrencySymbol, getViewsWord, getFavoritesWord } from '@/utils';
import { StarIcon as SolidStarIcon, PlayIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';
import {
  MapPinIcon,
  PencilIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import PhotoSlider from '@/components/photo-slider/photo-slider';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import MapModal from '@/components/map-modal/map-modal';
import FavoriteButton from '@/components/favorite-button/favorite-button';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfirmationModal } from '@/components/confirmation-modal/confirmation-modal-context';
import { useToast } from '@/components/toast/toast-context';
import { getOrCreateUserToken } from '@/utils';
import SellerContacts from './components/seller-contacts';

interface AdClientProps {
  ad: AdBase;
  similarAds?: AdBase[];
}

export default function AdClient({ ad, similarAds }: AdClientProps) {
  const photos = ad.photos.length > 0 ? ad.photos : ['default.jpg'];
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const isArchived = ad.status === 'archived';
  const toast = useToast();
  const { confirm } = useConfirmationModal();

  // Проверка авторизации и владения объявлением
  const { user, isLoggedIn, isAuthChecking } = useAuthStore();
  const isOwner = isLoggedIn && user?.id && parseInt(user.id) === ad.seller.id;

  // Состояния для операций с объявлением
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Запись просмотра при загрузке страницы
  useEffect(() => {
    const recordView = async () => {
      try {
        const localUserToken = getOrCreateUserToken();

        const response = await fetch(`/api/ads/${ad.id}/views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            localUserToken,
          }),
        });

        if (!response.ok) {
          // Не показываем ошибку пользователю, так как это не критично
          console.warn('Failed to record view:', response.status);
        }
      } catch (error) {
        console.warn('Error recording view:', error);
      }
    };

    recordView();
  }, [ad.id]);

  // Форматирование даты размещения
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Функция изменения статуса объявления
  const toggleAdStatus = async () => {
    if (!isOwner) return;

    const action = isArchived ? 'опубликовать' : 'снять с публикации';
    const actionText = isArchived
      ? 'Опубликовать объявление'
      : 'Снять с публикации';

    confirm(
      `Вы уверены, что хотите ${action} это объявление?`,
      async () => {
        try {
          setIsUpdatingStatus(true);
          const newStatus = isArchived ? 'active' : 'archived';

          const response = await fetch('/api/user/ads', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              adId: ad.id,
              status: newStatus,
            }),
          });

          if (response.ok) {
            // Перезагрузка с параметром для показа тоста
            const url = new URL(window.location.href);
            url.searchParams.set(
              'toast',
              newStatus === 'archived' ? 'archived' : 'published'
            );
            window.location.href = url.toString();
          } else {
            toast.show('Не удалось изменить статус объявления', {
              type: 'error',
            });
            console.error('Failed to update ad status');
          }
        } catch (error) {
          toast.show('Произошла ошибка при изменении статуса объявления', {
            type: 'error',
          });
          console.error('Error updating ad status:', error);
        } finally {
          setIsUpdatingStatus(false);
        }
      },
      { title: actionText }
    );
  };

  // Функция удаления объявления
  const deleteAd = async () => {
    if (!isOwner || !isArchived) return;

    confirm(
      'Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.',
      async () => {
        try {
          setIsUpdatingStatus(true);
          const response = await fetch(`/api/user/ads/${ad.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            // Перенаправление с параметром для показа тоста на новой странице
            window.location.href = '/?toast=ad-deleted';
          } else {
            toast.show('Не удалось удалить объявление', {
              type: 'error',
            });
            console.error('Failed to delete ad');
          }
        } catch (error) {
          toast.show('Произошла ошибка при удалении объявления', {
            type: 'error',
          });
          console.error('Error deleting ad:', error);
        } finally {
          setIsUpdatingStatus(false);
        }
      },
      { title: 'Удалить объявление' }
    );
  };

  return (
    <Suspense>
      <div className="container mx-auto px-4 py-6">
        {/* Блок уведомления для архивных объявлений владельца */}
        {!isAuthChecking && isOwner && isArchived && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 sm:p-4 mb-4 max-w-full lg:max-w-[960px] xl:max-w-[1080px] 2xl:max-w-[1166px]">
            <div className="flex flex-col gap-3">
              <p className="text-neutral-700 text-sm sm:text-base">
                Вы перенесли объявление в архив
              </p>
              <div className="flex max-[350px]:flex-col gap-2 w-full sm:w-auto sm:justify-end">
                <button
                  onClick={toggleAdStatus}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 bg-green-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Опубликовать
                </button>
                <button
                  onClick={deleteAd}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 bg-gray-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Хлебные крошки */}
        <nav
          className="text-xs sm:text-sm mb-4 overflow-hidden"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center space-x-2 min-w-0 overflow-hidden">
            <li>
              <a href="/" className="text-blue-500 hover:underline">
                Главная
              </a>
            </li>
            <li>›</li>
            <li>
              <a
                href={`/${ad.cityLabel}`}
                className="text-blue-500 hover:underline"
              >
                {ad.city}
              </a>
            </li>
            <li>›</li>
            <li>
              <a
                href={`/${ad.cityLabel}/${ad.category}`}
                className="text-blue-500 hover:underline"
              >
                {categoryOptions.find((c) => c.key === ad.category)?.label ||
                  ad.category}
              </a>
            </li>
            <li>›</li>
            <li className="text-gray-500 truncate max-w-full overflow-hidden min-w-0 flex-1">
              {ad.title}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 text-neutral-800">
          {/* Левая часть: фото и основные данные */}
          <div className="flex-1 space-y-6 lg:max-w-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1
                className={`text-2xl sm:text-3xl font-medium line-clamp-2 flex-1 min-w-0 overflow-hidden wrap-break-word ${
                  !isAuthChecking && isArchived && !isOwner
                    ? 'text-neutral-500'
                    : 'text-neutral-700'
                }`}
              >
                {ad.title}
              </h1>
              {!isAuthChecking && !isOwner && (
                <FavoriteButton
                  ad={ad}
                  solidIconClassName="w-8 h-8 sm:w-10 sm:h-10 text-violet-400"
                  outlineIconClassName="w-8 h-8 sm:w-10 sm:h-10 text-gray-600 fill-white/50 stroke-2"
                />
              )}
            </div>

            {/* Блок управления для владельца активного объявления */}
            {!isAuthChecking && isOwner && !isArchived && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-600 w-fit">
                  <span>Опубликовано {formatDate(ad.datePosted)}</span>
                  <span>
                    {ad.favoritesCount || 0}{' '}
                    {getFavoritesWord(ad.favoritesCount || 0)}
                  </span>
                  <span>
                    {ad.viewCount || 0} {getViewsWord(ad.viewCount || 0)}
                    {ad.viewsToday && ad.viewsToday > 0
                      ? ` (+${ad.viewsToday} сегодня)`
                      : ''}
                  </span>
                </div>
                <div className="flex max-[400px]:flex-col gap-2 w-full sm:w-auto sm:justify-end">
                  <Link
                    href={`/ad/edit/${ad.id}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 bg-violet-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
                  >
                    <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Редактировать
                  </Link>
                  <button
                    onClick={toggleAdStatus}
                    disabled={isUpdatingStatus}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 bg-orange-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArchiveBoxIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Снять с публикации
                  </button>
                </div>
              </div>
            )}

            {!isAuthChecking && isArchived && !isOwner && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-amber-800 font-medium text-center">
                  Объявление снято с публикации
                </p>
              </div>
            )}

            <div
              className={
                !isAuthChecking && isArchived && !isOwner ? 'opacity-50' : ''
              }
            >
              <PhotoSlider
                images={photos.map(
                  (src) =>
                    `https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                      src || 'default.jpg'
                    }`
                )}
              />
            </div>

            {ad.description && ad.description.trim() && (
              <p className="text-sm sm:text-base mb-4 wrap-break-word">
                {ad.description}
              </p>
            )}

            {ad.details && ad.details.trim() && (
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  Детали
                </h2>
                <p className="text-sm sm:text-base whitespace-pre-line wrap-break-word">
                  {ad.details}
                </p>
              </div>
            )}
          </div>

          {/* Правая часть: карточка с ценой, контактами, локацией */}
          <aside className="w-full lg:w-1/3 lg:px-8 shrink-0 space-y-4">
            {ad.price !== undefined && (
              <div className="p-4 border border-violet-400 rounded-md">
                <div className="text-2xl sm:text-3xl font-bold break-all max-w-full">
                  {ad.price.toLocaleString('ru-RU')}{' '}
                  {getCurrencySymbol(ad.currency)}
                </div>
              </div>
            )}

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Продавец
              </h3>
              <div className="flex items-start space-x-3 py-3">
                <Link
                  href={`/user/${ad.seller.id}/active`}
                  className="w-12 h-12 rounded-lg overflow-hidden shrink-0 hover:opacity-90 transition-opacity"
                >
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${
                      ad.seller.avatar || '765-default-avatar.png'
                    }`}
                    alt="Аватар продавца"
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/user/${ad.seller.id}/active`}
                    className="text-sm sm:text-base font-semibold wrap-break-word line-clamp-2 hover:opacity-90 transition-colors"
                  >
                    {ad.seller.name}
                  </Link>
                  <div className="flex items-center space-x-1 mt-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starPos = idx + 1;
                      const fillPercent = Math.min(
                        Math.max((ad.seller.rating - (starPos - 1)) * 100, 0),
                        100
                      );
                      return (
                        <div key={idx} className="relative w-4 h-4">
                          <OutlineStarIcon className="w-4 h-4 text-yellow-400" />
                          {fillPercent > 0 && (
                            <SolidStarIcon
                              className="absolute top-0 left-0 w-4 h-4 text-yellow-400 overflow-hidden"
                              style={{
                                clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                    <span className="text-xs sm:text-sm text-neutral-600 ml-1">
                      {ad.seller.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <SellerContacts
                phone={ad.seller.contact.phone}
                email={ad.seller.contact.email}
              />
            </div>

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Локация</h3>
              <p className="text-sm sm:text-base mb-3">
                {ad.city}
                {ad.address ? `, ${ad.address}` : ''}
              </p>
              <button
                onClick={() => setIsMapModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors font-medium"
              >
                <MapPinIcon className="w-4 h-4" />
                Посмотреть на карте
              </button>
            </div>
          </aside>
        </div>

        {/* Информация о дате и просмотрах для всех пользователей */}
        {!isAuthChecking && !isOwner && !isArchived && (
          <div className="pt-8 pb-2">
            <div className="flex flex-wrap sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <span>Опубликовано {formatDate(ad.datePosted)}</span>
              <span className="hidden sm:inline">·</span>
              <span>
                {ad.viewCount || 0} {getViewsWord(ad.viewCount || 0)}
                {ad.viewsToday && ad.viewsToday > 0
                  ? ` (+${ad.viewsToday} сегодня)`
                  : ''}
              </span>
            </div>
          </div>
        )}

        {/* Блок с похожими объявлениями */}
        {similarAds && similarAds.length > 0 && (
          <section className="mt-4 mb-8 text-neutral-800">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Похожие объявления
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarAds.slice(0, 8).map((x) => (
                <GalleryAdCard key={x.id} ad={x} />
              ))}
            </div>
          </section>
        )}

        {/* Модальное окно карты */}
        <MapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          ad={ad}
        />
      </div>
    </Suspense>
  );
}
