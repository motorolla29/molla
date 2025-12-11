'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MapGl from '../map-gl/map-gl';
import { AdBase } from '@/types/ad';
import Link from 'next/link';

interface MapSlotProps {
  ads: AdBase[];
}

export default function MapSlot({ ads }: MapSlotProps) {
  const [showFullMap, setShowFullMap] = useState(false);

  const [drawerAds, setDrawerAds] = useState<AdBase[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Блокируем/разблокируем прокрутку страницы
  useEffect(() => {
    if (showFullMap) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // на демонтировании компонента тоже убираем
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFullMap]);

  const handleFullPinClick = (ad: AdBase) => {
    setDrawerAds([ad]);
    setDrawerOpen(true);
  };
  const handleFullClusterClick = (clusterAds: AdBase[]) => {
    setDrawerAds(clusterAds);
    setDrawerOpen(true);
  };
  return (
    <>
      <div className="h-48 relative bg-gray-200 flex items-center justify-center rounded-md overflow-hidden">
        <MapGl
          ads={ads}
          onPinClick={() => setShowFullMap(true)}
          onClusterClick={() => setShowFullMap(true)}
        />
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
            <MapGl
              ads={ads}
              onPinClick={handleFullPinClick}
              onClusterClick={handleFullClusterClick}
            />
            <button
              onClick={() => setShowFullMap(false)}
              className="absolute cursor-pointer top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
            {drawerOpen && (
              <div
                className="
                  absolute bg-white shadow-lg overflow-auto z-10
                  bottom-0 left-0 w-full h-1/2
                  lg:top-0 lg:bottom-0 lg:left-0 lg:w-1/4 lg:h-full
                  custom-scrollbar
                "
              >
                <div className="flex justify-between items-center p-4 shadow-md sticky top-0 bg-violet-100 z-10">
                  <h2 className="text-lg font-medium">Объявления</h2>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 xl:grid-cols-2 overflow-auto">
                  {drawerAds.map((ad) => (
                    <Link
                      href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
                      target="blank"
                      key={ad.id}
                      className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:opacity-85"
                    >
                      <div className="h-32 overflow-hidden">
                        <img
                          src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                            ad.photos.length ? ad.photos[0] : 'default.jpg'
                          }`}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold truncate">
                          {ad.title}
                        </h3>
                        {ad.price != null && (
                          <p className="mt-1 text-sm text-green-600">
                            {ad.price.toLocaleString('ru-RU')} ₽
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
