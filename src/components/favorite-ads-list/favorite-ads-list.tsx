import { AdBase } from '@/types/ad';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';

interface FavoriteAdsListProps {
  ads: AdBase[];
}

export default function FavoriteAdsList({ ads }: FavoriteAdsListProps) {
  return (
    <>
      {ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full mt-30 px-4 text-gray-600">
          <img
            className="w-20 sm:w-30 opacity-75"
            src="https://ik.imagekit.io/motorolla29/molla/icons/empty-favs-image.svg"
            alt="favs-empty"
          />
          <p className="text-sm font-semibold sm:text-base text-center max-w-100">
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
}
