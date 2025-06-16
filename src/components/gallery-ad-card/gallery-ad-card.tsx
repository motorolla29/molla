import { getCurrencySymbol } from '@/utils';
import Link from 'next/link';

export default function GalleryAdCard({ ad }) {
  return (
    <div key={ad.id} className="flex flex-col w-full overflow-hidden h-full">
      <Link
        href={'/'}
        className="w-full aspect-square mb-2 overflow-hidden rounded-lg"
      >
        <img
          src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
            ad.photos[0] || 'default.jpg'
          }`}
          alt={ad.title}
          className="w-full h-full object-cover"
        />
      </Link>
      <div className="flex-1 flex-col">
        <Link
          href={'/'}
          className="text-stone-800 line-clamp-2 hover:text-violet-600"
        >
          {ad.title}
        </Link>
        <p className="text-md font-semibold">
          {ad.price} {getCurrencySymbol(ad.currency)}
        </p>
        <p className="text-sm flex items-center text-stone-400 pt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-3.5 mr-1"
          >
            <path
              fillRule="evenodd"
              d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              clipRule="evenodd"
            />
          </svg>
          {ad.city}
        </p>
      </div>
    </div>
  );
}
