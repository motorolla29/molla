'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import {
  Plus,
  MapPin,
  Calendar,
  List,
  Eye,
  MoreVertical,
  Archive,
  Edit,
} from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  datePosted: string;
  city: string;
  cityLabel: string;
  category: string;
  photos: string[];
  status: 'active' | 'archived';
}

export default function MyAddsPage() {
  const { user } = useAuthStore();
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<string | null>(null);

  // Вычисляем счетчики на основе всех объявлений
  const activeCount = allAds.filter((ad) => ad.status === 'active').length;
  const archivedCount = allAds.filter((ad) => ad.status === 'archived').length;

  // Общий счетчик всех объявлений
  const totalAdsCount = allAds.length;

  // Фильтруем объявления для текущего таба
  const ads = allAds.filter((ad) => ad.status === activeTab);

  // Загрузка всех объявлений пользователя
  const loadAllAds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/ads?status=all');
      const data = await response.json();

      if (data.success) {
        setAllAds(data.ads);
      } else {
        console.error('Failed to load ads:', data.error);
        setAllAds([]);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setAllAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAds();
  }, []);

  // Закрытие попапа при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openPopup && !(event.target as Element).closest('[data-popup]')) {
        setOpenPopup(null);
      }
    }

    if (openPopup) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openPopup]);

  // Функция для удаления объявления
  const deleteAd = async (adId: string) => {
    try {
      const response = await fetch(`/api/user/ads/${adId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Перезагружаем все объявления
        await loadAllAds();
      } else {
        console.error('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  // Функция для изменения статуса объявления
  const toggleAdStatus = async (
    adId: string,
    currentStatus: 'active' | 'archived'
  ) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';

    try {
      setIsUpdating(adId);
      const response = await fetch('/api/user/ads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Обновляем локальное состояние
        setAllAds((prevAds) =>
          prevAds.map((ad) =>
            ad.id === adId ? { ...ad, status: newStatus } : ad
          )
        );
      } else {
        console.error('Failed to update ad status:', data.error);
      }
    } catch (error) {
      console.error('Error updating ad status:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return 'Цена не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Заголовок для мобильных */}
      <div className="mb-4 lg:mb-0">
        {isLoading ? (
          <div className="flex items-center lg:hidden">
            <div className="h-7 bg-gray-200 rounded w-44 animate-pulse"></div>
          </div>
        ) : (
          <h1 className="flex items-center justify-between text-xl sm:text-2xl w-fit font-medium mb-4 lg:hidden">
            <span>Мои объявления</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-500 ml-2">
              {totalAdsCount}
            </span>
          </h1>
        )}
      </div>

      {/* Кнопка создания и счетчик */}
      {isLoading ? (
        <div className="flex items-center justify-between mb-6">
          <div className="h-9 bg-gray-200 rounded-lg w-full lg:w-48 animate-pulse"></div>
          <div className="hidden lg:block h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/ad/create"
            className="w-full text-center inline-flex items-center justify-center px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 active:bg-violet-700 transition-colors lg:hidden"
          >
            <Plus size={16} className="mr-2" />
            <span className="whitespace-nowrap">Создать объявление</span>
          </Link>
          <Link
            href="/ad/create"
            className="hidden lg:inline-flex items-center px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 active:bg-violet-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Создать объявление
          </Link>

          {/* Счетчик для десктоп в той же строке */}
          <div className="hidden lg:block">
            <p className="text-sm text-gray-600">
              {totalAdsCount > 0
                ? `Всего объявлений: ${totalAdsCount}`
                : 'Нет объявлений'}
            </p>
          </div>
        </div>
      )}

      {/* Переключатель статуса */}
      {isLoading ? (
        <div className="flex border-b border-gray-200 mb-6">
          <div className="relative pl-4 py-2">
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="relative ml-6 pl-4 py-2">
            <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`relative px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
              activeTab === 'active'
                ? 'border-violet-400 text-violet-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Активные
            {activeCount > 0 && (
              <span className="absolute -top-px -right-px sm:-top-[3px] sm:-right-[3px] bg-violet-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px]">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`relative ml-6 px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
              activeTab === 'archived'
                ? 'border-violet-400 text-violet-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Архив
            {archivedCount > 0 && (
              <span className="absolute -top-px -right-px sm:-top-[3px] sm:-right-[3px] bg-gray-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px]">
                {archivedCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Список объявлений */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg animate-pulse">
              <div className="flex min-w-0">
                {/* Фото */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 bg-gray-200 rounded-lg"></div>

                {/* Контент */}
                <div className="flex-1 px-4 py-1 min-w-0 ml-1">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="h-5.5 bg-gray-200 rounded-md w-2/5 mb-2"></div>
                      {/* Цена под титлом только на самых маленьких экранах */}
                      <div className="sm:hidden h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    </div>
                    {/* Цена справа на sm и выше */}
                    <div className="hidden sm:block h-5.5 bg-gray-200 rounded-md w-16 ml-2 shrink-0"></div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="h-3.5 bg-gray-200 rounded w-20"></div>
                    <div className="h-3.5 bg-gray-200 rounded w-20"></div>
                    <div className="h-3.5 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : ads.length > 0 ? (
        <div className="space-y-4">
          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
              className="block"
            >
              <div className=" transition-colors rounded-lg overflow-visible">
                <div className="flex min-w-0">
                  {/* Фото */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-grey-100 flex items-center justify-center rounded-xl overflow-hidden">
                    <img
                      src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                        ad.photos[0] || 'default.jpg'
                      }`}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Контент */}
                  <div className="hover:bg-neutral-100 rounded-xl flex-1 pl-2 ml-2 min-w-0 overflow-visible">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      {/* Левая колонка - заголовок и мета-информация */}
                      <div className="min-w-0 overflow-hidden">
                        {/* Мобильная версия */}
                        <div className="sm:hidden">
                          <div className="mb-1">
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {ad.title}
                            </h3>
                          </div>
                          <div className="mb-2">
                            <div className="text-base font-semibold text-gray-900">
                              {formatPrice(ad.price, ad.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Десктоп версия - заголовок в одной строке с ценой и кнопкой */}
                        <div className="hidden sm:flex items-center justify-between gap-4 my-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate flex-1 min-w-0">
                            {ad.title}
                          </h3>
                          <div className="text-right px-1 shrink-0">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatPrice(ad.price, ad.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Мета-информация */}
                        <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2 sm:gap-4">
                          <div className="flex items-center">
                            <MapPin size={12} className="mr-1 shrink-0" />
                            <span className="truncate">{ad.city}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar size={12} className="mr-1 shrink-0" />
                            <span className="truncate">
                              {formatDate(ad.datePosted)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Правая колонка - кнопка действий */}
                      <div className="relative shrink-0 h-fit">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenPopup(openPopup === ad.id ? null : ad.id);
                          }}
                          className="m-1 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openPopup === ad.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.location.href = `/ad/edit/${ad.id}`;
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit
                                  size={12}
                                  className="sm:w-[14px] sm:h-[14px]"
                                />
                                Редактировать
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleAdStatus(ad.id, ad.status);
                                  setOpenPopup(null);
                                }}
                                disabled={isUpdating === ad.id}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                              >
                                {isUpdating === ad.id ? (
                                  <div className="w-3.5 h-3.5 border border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                                ) : (
                                  <Archive
                                    size={12}
                                    className="sm:w-[14px] sm:h-[14px]"
                                  />
                                )}
                                {ad.status === 'active'
                                  ? 'Снять с продажи'
                                  : 'Опубликовать'}
                              </button>
                              {activeTab === 'archived' && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        'Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.'
                                      )
                                    ) {
                                      deleteAd(ad.id);
                                    }
                                    setOpenPopup(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] lucide lucide-trash-2"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    <line
                                      x1="10"
                                      x2="10"
                                      y1="11"
                                      y2="17"
                                    ></line>
                                    <line
                                      x1="14"
                                      x2="14"
                                      y1="11"
                                      y2="17"
                                    ></line>
                                  </svg>
                                  Удалить
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <List size={32} className="text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {totalAdsCount === 0
              ? 'У вас пока нет объявлений'
              : `${
                  activeTab === 'active'
                    ? 'Нет активных объявлений'
                    : 'Нет объявлений в архиве'
                }`}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            {totalAdsCount === 0
              ? 'Создайте первое объявление и начните продавать или обмениваться вещами'
              : `В разделе ${
                  activeTab === 'active' ? 'активные' : 'архив'
                } пока нет объявлений`}
          </p>
        </div>
      )}
    </div>
  );
}
