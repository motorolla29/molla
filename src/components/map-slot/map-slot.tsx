'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MapGl from '../map-gl/map-gl';

export default function MapSlot({ ads }) {
  const [showFullMap, setShowFullMap] = useState(false);
  return (
    <>
      <div className="h-48 relative bg-gray-200 flex items-center justify-center rounded-md overflow-hidden">
        <MapGl ads={ads} />
        <div className="absolute inset-0 bg-white/40" />
        <button
          onClick={() => setShowFullMap(true)}
          className="absolute rounded-md text-white bg-violet-400 cursor-pointer px-4 py-2 mt-18 shadow-xl hover:bg-violet-500"
        >
          Посмотреть на карте
        </button>
      </div>
      {showFullMap && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative w-full h-full bg-white">
            <MapGl ads={ads} />
            <button
              onClick={() => setShowFullMap(false)}
              className="absolute cursor-pointer top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
