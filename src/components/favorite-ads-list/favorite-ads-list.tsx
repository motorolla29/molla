import { useState, useEffect } from 'react';
import { AdBase } from '@/types/ad';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';

interface FavoriteAdsListProps {
  ads: AdBase[];
  isLoading?: boolean;
}

const FavoriteAdsList = ({ ads, isLoading = false }: FavoriteAdsListProps) => {
  // Локальная копия списка для избранного - не меняется до перезагрузки страницы
  const [localAds, setLocalAds] = useState<AdBase[]>([]);

  useEffect(() => {
    // Инициализируем локальную копию только при первом рендере или изменении ads
    if (localAds.length === 0 && ads.length > 0) {
      setLocalAds([...ads]);
    }
  }, [ads, localAds.length]);

  // Компонент скелетона для объявления
  const AdSkeleton = () => (
    <div className="flex flex-col w-full overflow-hidden h-full">
      <div className="w-full aspect-square mb-2 overflow-hidden rounded-lg bg-gray-200 animate-pulse" />
      <div className="flex-1 flex-col">
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );

  return (
    <>
      {isLoading ? (
        // Показываем 8 скелетонов во время загрузки
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <AdSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full mt-30 px-4 text-gray-600">
          <img
            className="w-20 sm:w-30 opacity-75"
            src="https://ik.imagekit.io/motorolla29/molla/icons/empty-favs-image.svg"
            alt="favs-empty"
          />
          <p className="text-sm sm:text-base text-center max-w-100">
            У вас ещё нет избранных объявлений. Если вы нашли что-то интересное,
            нажмите на сердечко в результатах поиска.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {ads.map((ad) => (
            <GalleryAdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </>
  );
};

export default FavoriteAdsList;
