'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  BellIcon,
  BellSlashIcon,
  UserIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CogIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { ArrowLeft } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Сбрасываем счетчик в header при открытии страницы (красная точка гаснет сразу)
  useEffect(() => {
    const { useNotificationsStore } = require('@/store/useNotificationsStore');
    useNotificationsStore.getState().reset();
  }, []);

  // Загружаем уведомления при монтировании
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');

      if (!response.ok) {
        throw new Error('Ошибка загрузки уведомлений');
      }

      const data = await response.json();
      setNotifications(data.notifications);

      // Отмечаем все уведомления прочитанными после загрузки
      // (это гарантированно сработает при обновлении страницы)
      await markAllAsRead();
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError(error instanceof Error ? error.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = 'h-5 w-5 sm:h-6 sm:w-6 shrink-0';

    switch (type) {
      case 'message':
        return <BellIcon className={`${iconClass} text-blue-600`} />;
      case 'profile_update':
        return <UserIcon className={`${iconClass} text-green-600`} />;
      case 'login_new_device':
        return <ShieldCheckIcon className={`${iconClass} text-orange-600`} />;
      case 'ad_status_change':
        return <DocumentTextIcon className={`${iconClass} text-purple-600`} />;
      case 'review_created':
        return <StarIcon className={`${iconClass} text-yellow-500`} />;
      case 'system':
        return <CogIcon className={`${iconClass} text-gray-600`} />;
      default:
        return (
          <ExclamationTriangleIcon className={`${iconClass} text-red-600`} />
        );
    }
  };

  return (
    <div className="m-4 lg:m-6">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Уведомления</h1>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200/60 h-20 sm:h-24 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6">
          <p className="text-red-800 text-sm sm:text-base">
            {error || 'Ошибка загрузки уведомлений'}
          </p>
          <button
            onClick={loadNotifications}
            className="mt-3 sm:mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Попробовать снова
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-6">
          <BellSlashIcon className="mb-2 h-8 w-8 sm:h-10 sm:w-10 text-neutral-400" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">
            У вас нет уведомлений
          </h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-sm mx-auto">
            Здесь будут отображаться важные системные уведомления
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-2xl p-4 ${
                notification.isRead
                  ? 'bg-white/15 border-gray-300/50'
                  : 'bg-white border-gray-300/50 hover:border-gray-300/75'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`font-semibold text-sm sm:text-base ${
                        notification.isRead
                          ? 'text-neutral-600'
                          : 'text-neutral-900'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-red-300 rounded-full shrink-0 mt-2"></div>
                    )}
                  </div>
                  <p
                    className={`text-sm sm:text-base mb-2 sm:mb-3 leading-relaxed wrap-break-word ${
                      notification.isRead
                        ? 'text-neutral-600'
                        : 'text-neutral-900'
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Информационное сообщение */}
          <div className="text-center py-2 px-4">
            <p className="text-xs sm:text-sm text-gray-500">
              {notifications.length >= 20
                ? 'Показаны последние 20 уведомлений'
                : 'Это все уведомления за последние 30 дней'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
