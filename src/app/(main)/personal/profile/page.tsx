'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { cityName } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);

  // Layout уже проверил авторизацию
  if (!user) return null;

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      router.replace('/');
      // Небольшая задержка перед очисткой состояния, чтобы router успел выполнить перенаправление
      setTimeout(() => {
        logout();
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 lg:p-4">
      {/* Аватар и имя */}
      <div className="flex items-center mb-8 sm:mb-12">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="ml-4 sm:ml-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            {user.name}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-2">
            ID: {user.id.toString().slice(-8).toUpperCase()}
          </p>
          <div className="flex items-center space-x-1">
            {/* Stars with underlying outline and overlay fill */}
            {Array.from({ length: 5 }).map((_, idx) => {
              const starPos = idx + 1;
              const fillPercent = Math.min(
                Math.max((user.rating - (starPos - 1)) * 100, 0),
                100
              );
              return (
                <div key={idx} className="relative w-4 h-4">
                  <OutlineStarIcon className="w-4 h-4 text-yellow-400" />
                  {fillPercent > 0 && (
                    <SolidStarIcon
                      className="absolute top-0 left-0 w-4 h-4 text-yellow-400 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
                    />
                  )}
                </div>
              );
            })}
            {/* Rating number */}
            <span className="text-xs sm:text-sm text-gray-600 ml-1">
              {user.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Контактные данные */}
      <div className="space-y-8">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            Контактные данные
          </h3>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Город
                </p>
                <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                  {cityName || 'Не указан'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Телефон
                </p>
                <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                  {user.phone || 'Не указан'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка выхода */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {isLoading ? 'Выход...' : 'Выйти из профиля'}
        </button>
      </div>
    </div>
  );
}
