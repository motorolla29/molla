import { getCurrencySymbol } from '@/utils';
import Link from 'next/link';
import { AdBase } from '@/types/ad';
import FavoriteButton from '../favorite-button/favorite-button';
interface GalleryAdCardProps {
  ad: AdBase;
}

export default function GalleryAdCard({ ad }: GalleryAdCardProps) {
  const isArchived = ad.status === 'archived';

  return (
    <Link
      href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
      className="flex flex-col w-full overflow-hidden h-full min-w-0"
    >
      <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg">
        <img
          src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
            ad.photos[0] || 'default.jpg'
          }`}
          alt={ad.title}
          className={`w-full h-full object-cover ${
            isArchived ? 'opacity-50' : ''
          }`}
        />
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
        <p className="text-xs flex items-center text-neutral-400 pt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-3.5 mr-1 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{ad.city}</span>
        </p>
      </div>
    </Link>
  );
}
