'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/toast/toast-context';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';
import { EditProfileModal } from '@/components/edit-profile-modal/edit-profile-modal';
import AvatarModal from '@/components/avatar-modal/avatar-modal';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // Скролл вверх при загрузке страницы профиля (для мобильных браузеров)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Состояние для модального окна редактирования профиля
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Состояние для модального окна просмотра аватара
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Layout уже проверил авторизацию
  if (!user) return null;

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Сначала вызываем logout для очистки состояния и cookies
      await logout();
      // Затем используем полную перезагрузку страницы для гарантии в production build
      const url = new URL('/', window.location.origin);
      url.searchParams.set('toast', 'logout');
      window.location.href = url.toString();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsAvatarUploading(true);
    try {
      // Загружаем файл на ImageKit
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('folder', '/molla/user-avatars');

      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Не удалось загрузить изображение');
      }

      const uploadData = await uploadRes.json();

      // Обновляем пользователя с новым аватаром
      await updateUser({ avatar: uploadData.name });

      toast.show('Аватар успешно обновлен!', {
        type: 'success',
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.show(
        error instanceof Error ? error.message : 'Ошибка при загрузке аватара',
        {
          type: 'error',
        }
      );
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleAvatarUpload(file);
      }
    };
    input.click();
  };

  return (
    <div className="p-2 lg:px-6">
      {/* Аватар и имя */}
      <div className="flex items-center mb-8 sm:mb-12">
        <div className="relative">
          {user.avatar ? (
            <img
              src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${
                user.avatar || '765-default-avatar.png'
              }`}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer"
              onClick={() => setShowAvatarModal(true)}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg cursor-pointer select-none">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Кнопка установки аватара */}
          <button
            onClick={handleAvatarClick}
            disabled={isAvatarUploading}
            className="absolute -bottom-1 -right-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed border-2 border-white"
            aria-label="Установить аватар"
          >
            {isAvatarUploading ? (
              <svg
                className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="ml-4 sm:ml-6 flex-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1 line-clamp-2 wrap-break-word">
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
                          style={{
                            clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                          }}
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
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-3 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200 hover:scale-105 ml-3 shrink-0"
              aria-label="Редактировать профиль"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
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
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Город
                    </p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                      {user.city || 'Не указан'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
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
          className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Модальное окно просмотра аватара */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        avatar={user.avatar || '765-default-avatar.png'}
        name={user.name}
      />

      {/* Модальное окно редактирования профиля */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        // В модалку передаём город из профиля; стора локации не используем
        cityName={user.city}
        onSave={async (updates) => {
          await updateUser(updates);
          toast.show('Профиль обновлен!', {
            type: 'success',
          });
        }}
      />
    </div>
  );
}
