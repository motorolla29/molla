'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Plus, MapPin, Calendar, List, Eye } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  price: number;
  currency: string;
  datePosted: string;
  city: string;
  category: string;
  photos: string[];
  views?: number;
}

export default function MyAddsPage() {
  const { user } = useAuthStore();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // В будущем здесь будет API запрос для получения объявлений пользователя
    // Пока показываем заглушку
    setTimeout(() => {
      setAds([
        {
          id: '1',
          title: 'iPhone 15 Pro 256GB',
          price: 120000,
          currency: 'RUB',
          datePosted: '2025-12-15T10:30:00.000Z',
          city: 'Москва',
          category: 'goods',
          photos: ['1.jpg'],
          views: 45,
        },
        {
          id: '2',
          title: 'MacBook Pro M3 16"',
          price: 280000,
          currency: 'RUB',
          datePosted: '2025-12-14T15:20:00.000Z',
          city: 'Санкт-Петербург',
          category: 'goods',
          photos: [],
          views: 23,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
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
          <h1 className="relative text-lg sm:text-xl w-fit font-medium mb-4 lg:hidden">
            Мои объявления
            <span className="absolute text-xs sm:text-sm font-bold text-neutral-500 -right-4 top-0">
              {ads.length}
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
              {ads.length > 0
                ? `Всего объявлений: ${ads.length}`
                : 'Нет объявлений'}
            </p>
          </div>
        </div>
      )}

      {/* Список объявлений */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg animate-pulse">
              <div className="flex min-w-0">
                {/* Фото */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-200 rounded-lg"></div>

                {/* Контент */}
                <div className="flex-1 px-4 py-1 min-w-0 ml-1">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="h-5.5 bg-gray-200 rounded-md w-2/5 mb-2"></div>
                      {/* Цена под титлом только на самых маленьких экранах */}
                      <div className="sm:hidden h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    </div>
                    {/* Цена справа на sm и выше */}
                    <div className="hidden sm:block h-5.5 bg-gray-200 rounded-md w-16 ml-2 flex-shrink-0"></div>
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
              href={`/${ad.city.toLowerCase().replace(/\s+/g, '-')}/${
                ad.category
              }/${ad.id}`}
              className="block"
            >
              <div className=" transition-colors rounded-lg overflow-hidden">
                <div className="flex min-w-0">
                  {/* Фото */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-grey-100 flex items-center justify-center rounded-xl overflow-hidden">
                    <img
                      src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                        ad.photos[0] || 'default.jpg'
                      }`}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Контент */}
                  <div className="hover:bg-neutral-100 rounded-xl flex-1 px-2 ml-2 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 break-words overflow-hidden">
                          {ad.title}
                        </h3>
                        {/* Цена под титлом только на самых маленьких экранах */}
                        <div className="sm:hidden text-base font-semibold text-gray-900 mb-2">
                          {formatPrice(ad.price, ad.currency)}
                        </div>
                        <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2 sm:gap-4">
                          <div className="flex items-center">
                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                            <span className="truncate">{ad.city}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar
                              size={12}
                              className="mr-1 flex-shrink-0"
                            />
                            <span className="truncate">
                              {formatDate(ad.datePosted)}
                            </span>
                          </div>
                          {ad.views && (
                            <div className="flex items-center">
                              <Eye size={12} className="mr-1 flex-shrink-0" />
                              <span className="truncate">{ad.views} просм</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Цена справа на sm и выше */}
                      <div className="hidden px-1 sm:block text-right ml-4 flex-shrink-0">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(ad.price, ad.currency)}
                        </div>
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
            У вас пока нет объявлений
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Создайте первое объявление и начните продавать или обмениваться
            вещами
          </p>
        </div>
      )}
    </div>
  );
}
