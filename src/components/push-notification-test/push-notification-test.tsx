'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationTest() {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotifications();

  const [testMessage, setTestMessage] = useState('');

  const handleTestPush = async () => {
    if (!testMessage.trim()) return;

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Тестовое уведомление',
          body: testMessage,
        }),
      });

      if (response.ok) {
        alert('Push-уведомление отправлено!');
      } else {
        alert('Ошибка отправки push-уведомления');
      }
    } catch (error) {
      console.error('Error sending test push:', error);
      alert('Ошибка отправки push-уведомления');
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">
          Push-уведомления не поддерживаются
        </h3>
        <p className="text-yellow-700 text-sm">
          Ваш браузер не поддерживает push-уведомления. Попробуйте Chrome,
          Firefox или Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">
        Тестирование Push-уведомлений
      </h3>

      {/* Статус */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Разрешение:</span>
          <span
            className={`text-sm px-2 py-1 rounded ${
              permission === 'granted'
                ? 'bg-green-100 text-green-800'
                : permission === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {permission === 'granted'
              ? 'Разрешено'
              : permission === 'denied'
              ? 'Запрещено'
              : 'Не запрошено'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Подписка:</span>
          <span
            className={`text-sm px-2 py-1 rounded ${
              isSubscribed
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isSubscribed ? 'Активна' : 'Не активна'}
          </span>
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Кнопки управления */}
      <div className="mb-4 space-y-2">
        {permission === 'default' && (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Запрос разрешения...' : 'Запросить разрешение'}
          </button>
        )}

        {!isSubscribed ? (
          <button
            onClick={subscribe}
            disabled={isLoading || permission !== 'granted'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Подписка...' : 'Подписаться на push'}
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Отписка...' : 'Отписаться от push'}
          </button>
        )}
      </div>

      {/* Тестовое уведомление */}
      {isSubscribed && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Отправить тестовое уведомление
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Текст уведомления"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleTestPush}
              disabled={!testMessage.trim()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Отправить тестовое push
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
