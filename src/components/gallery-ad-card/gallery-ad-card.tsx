import { getCurrencySymbol, formatAdDateGallery } from '@/utils';
import Link from 'next/link';
import { AdBase } from '@/types/ad';
import FavoriteButton from '../favorite-button/favorite-button';
import { CloudImage } from '@/components/cloud-image/cloud-image';
import { useViewedAdsStore } from '@/store/useViewedAdsStore';
interface GalleryAdCardProps {
  ad: AdBase;
}

export default function GalleryAdCard({ ad }: GalleryAdCardProps) {
  const isArchived = ad.status === 'archived';
  const { viewedIds, markViewed } = useViewedAdsStore();
  const isViewed = ad.isViewed || viewedIds.has(ad.id);

  return (
    <Link
      href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
      target="_blank"
      className="flex flex-col w-full overflow-hidden h-full min-w-0"
      onClick={() => markViewed(ad.id)}
    >
      <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg bg-gray-200/25">
        {/* <img
          src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
            ad.photos[0] || 'default.svg'
          }?tr=w-350`}
          className={`w-full h-full object-cover ${
            isArchived ? 'opacity-50' : ''
          }`}
        /> */}
        <CloudImage
          src={`ad-photos/${ad.photos[0] || 'default.svg'}`}
          variant="md"
          className={`w-full h-full object-cover ${isArchived ? 'opacity-50' : ''}`}
        />
        {isViewed && (
          <div className="absolute inset-0 bg-white/40 pointer-events-none">
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-2 py-0.5 rounded-full bg-black/50 text-[8px] min-[400px]:text-[10px] font-semibold text-white">
              Просмотрено
            </div>
          </div>
        )}
        {/* Кнопка избранного */}
        <FavoriteButton ad={ad} className="absolute top-2 right-2" />
      </div>
      <div className="flex-1 flex-col min-w-0">
        <h3 className="text-sm sm:text-base md:text-lg text-neutral-800 leading-[1.2] pb-1 hover:text-violet-400 truncate min-w-0">
          {ad.title}
        </h3>
        <p
          className={`text-xs sm:text-sm md:text-base font-semibold truncate ${
            isArchived ? 'opacity-50' : ''
          }`}
        >
          {ad.price?.toLocaleString('ru-RU')} {getCurrencySymbol(ad.currency)}
        </p>
        <p className="text-[10px] sm:text-xs flex items-center text-neutral-400 pt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-3 sm:size-3.5 mr-1 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{ad.city}</span>
        </p>
        {formatAdDateGallery(ad.datePosted) && (
          <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">
            {formatAdDateGallery(ad.datePosted)}
          </p>
        )}
      </div>
    </Link>
  );
}
