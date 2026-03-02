import { getCurrencySymbol, formatAdDate } from '@/utils';
import Link from 'next/link';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';
import { AdBase } from '@/types/ad';
import FavoriteButton from '../favorite-button/favorite-button';
import { CloudImage } from '@/components/cloud-image/cloud-image';
import { useViewedAdsStore } from '@/store/useViewedAdsStore';

interface DefaultAdCardProps {
  ad: AdBase;
  disableViewedOverlay?: boolean;
}

export default function DefaultAdCard({
  ad,
  disableViewedOverlay = false,
}: DefaultAdCardProps) {
  const { viewedIds, markViewed } = useViewedAdsStore();
  const isViewed = !disableViewedOverlay && (ad.isViewed || viewedIds.has(ad.id));
  return (
    <div
      key={ad.id}
      className="flex w-full overflow-hidden h-full p-0 sm:p-4 my-3 sm:my-0 rounded-xl sm:hover:bg-neutral-100/50"
    >
      {/* Фото */}
      <Link
        className="rounded-2xl relative w-26 h-26 sm:w-36 sm:h-36 bg-gray-200/25 overflow-hidden"
        href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
        target="_blank"
        onClick={() => markViewed(ad.id)}
      >
        {/* было: <img
          src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
            ad.photos[0] || 'default.svg'
          }?tr=w-250`}
          className="w-full h-full object-cover"
        /> */}
        <CloudImage
          src={`ad-photos/${ad.photos[0] || 'default.svg'}`}
          variant="md"
          className="w-full h-full object-cover"
        />
        {isViewed && (
          <div className="absolute inset-0 bg-white/40 pointer-events-none">
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-2 py-0.5 rounded-full bg-black/50 text-[8px] sm:text-[10px] font-semibold text-white">
              Просмотрено
            </div>
          </div>
        )}
      </Link>

      {/* Основная информация */}
      <Link
        className="flex-1 flex-col justify-between ml-3 sm:ml-4 relative min-w-0"
        href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
        target="_blank"
      >
        {/* Кнопка избранного */}
        <FavoriteButton ad={ad} className="absolute top-0 right-0" />
        <div className="overflow-hidden">
          <h2 className="text-base sm:text-lg font-semibold line-clamp-1 hover:text-violet-400 mr-10 mb-2 leading-tight max-w-full overflow-hidden wrap-break-word">
            {ad.title}
          </h2>
          {ad.description && ad.description.trim() && (
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 mb-1 line-clamp-2 max-w-full overflow-hidden wrap-break-word">
              {ad.description}
            </p>
          )}
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold">
            {ad.price?.toLocaleString('ru-RU')} {getCurrencySymbol(ad.currency)}
          </p>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
            {ad.city}
          </p>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {formatAdDate(ad.datePosted)}
          </p>
        </div>
      </Link>

      {/* Информация о продавце */}
      <Link
        href={`/user/${ad.seller.id}/active`}
        target="_blank"
        className="hidden w-32 sm:flex flex-col items-start justify-start ml-8 overflow-hidden hover:opacity-90 transition-opacity"
      >
        <div className="w-18 h-18 rounded-lg mb-2 bg-gray-200/25 overflow-hidden">
          {/* было: <img
            className="w-full h-full object-cover"
            src={
              ad.seller.avatar
                ? `${ad.seller.avatar}?tr=w-100`
                : 'https://ik.imagekit.io/motorolla29/molla/user-avatars/765-default-avatar.png?tr=w-100'
            }
          /> */}
          <CloudImage
            src={ad.seller.avatar || 'user-avatars/765-default-avatar.png'}
            variant="sm"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs sm:text-sm font-semibold pr-1 max-w-full inline-block truncate wrap-break-words">
          {ad.seller.name}
        </span>
        <div className="flex items-center mt-2 space-x-1">
          {/* Stars with underlying outline and overlay fill*/}
          {Array.from({ length: 5 }).map((_, idx) => {
            const starPos = idx + 1;
            const fillPercent = Math.min(
              Math.max((ad.seller.rating - (starPos - 1)) * 100, 0),
              100,
            );
            return (
              <div key={idx} className="relative w-4 h-4">
                <OutlineStarIcon className="w-4 h-4 text-yellow-400" />
                {fillPercent > 0 && (
                  <SolidStarIcon
                    className="absolute top-0 left-0 w-4 h-4 text-yellow-400 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
                  />
                )}
              </div>
            );
          })}
          {/* Rating number */}
          <span className="text-xs sm:text-sm text-neutral-600 ml-1">
            {ad.seller.rating.toFixed(1)}
          </span>
        </div>
      </Link>
    </div>
  );
}
