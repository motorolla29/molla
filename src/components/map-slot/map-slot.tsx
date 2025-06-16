import { useState } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function MapSlot() {
  const [showFullMap, setShowFullMap] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Карта объявлений</h2>
        <button
          onClick={() => setShowFullMap(true)}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <MapPinIcon className="h-5 w-5" />
          Посмотреть на карте
        </button>
      </div>
      {/* Заглушка для мини-карты */}
      <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
        Мини-карта (здесь подключите компонент с Яндекс.Картой или Map)
      </div>
    </div>
  );

  {
    /* Модалка/оверлей для полной карты */
  }
  {
    showFullMap && (
      <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="relative w-full h-full bg-white">
          <button
            onClick={() => setShowFullMap(false)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
            aria-label="Закрыть"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
          {/* Здесь разместите ваш компонент карты на весь экран */}
          <div className="w-full h-full">
            Полная карта (здесь компонент с Яндекс.Картой)
          </div>
        </div>
      </div>
    );
  }
}
