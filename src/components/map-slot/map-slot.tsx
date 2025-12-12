'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MapGl from '../map-gl/map-gl';
import { AdBase } from '@/types/ad';
import ClusterAdsDrawer from '../cluster-ads-drawer/cluster-ads-drawer';

interface MapSlotProps {
  ads: AdBase[];
  cityLabel?: string;
  category?: string;
}

export default function MapSlot({ ads, cityLabel, category }: MapSlotProps) {
  const searchParams = useSearchParams();
  const [showFullMap, setShowFullMap] = useState(false);

  const [drawerAdIds, setDrawerAdIds] = useState<string[]>([]);
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
    setDrawerAdIds([ad.id]);
    setDrawerOpen(true);
  };
  const handleFullClusterClick = (clusterAds: AdBase[]) => {
    setDrawerAdIds(clusterAds.map((ad) => ad.id));
    setDrawerOpen(true);
  };
  return (
    <>
      <div className="h-48 relative bg-gray-200 flex items-center justify-center rounded-md overflow-hidden">
        <MapGl
          key={`mini-${searchParams.toString()}`}
          ads={ads}
          cityLabel={cityLabel}
          category={category}
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
              key={`full-${searchParams.toString()}`}
              ads={ads}
              cityLabel={cityLabel}
              category={category}
              onPinClick={handleFullPinClick}
              onClusterClick={handleFullClusterClick}
            />
            <button
              onClick={() => {
                setShowFullMap(false);
                setDrawerOpen(false);
              }}
              className="absolute cursor-pointer top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
            {drawerOpen && (
              <ClusterAdsDrawer
                adIds={drawerAdIds}
                cityLabel={cityLabel}
                onClose={() => setDrawerOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
