'use client';

import { Suspense, useState } from 'react';
import { AdBase } from '@/types/ad';
import { categoryOptions } from '@/const';
import { getCurrencySymbol } from '@/utils';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PhotoSlider from '@/components/photo-slider/photo-slider';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import MapModal from '@/components/map-modal/map-modal';

interface AdClientProps {
  ad: AdBase;
  similarAds?: AdBase[];
}

export default function AdClient({ ad, similarAds }: AdClientProps) {
  const photos = ad.photos.length > 0 ? ad.photos : ['default.jpg'];
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  return (
    <Suspense>
      <div className="container mx-auto px-4 py-6">
        {/* Хлебные крошки */}
        <nav className="text-sm mb-4 overflow-hidden" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 min-w-0 overflow-hidden">
            <li>
              <a href="/" className="text-blue-500 hover:underline">
                Главная
              </a>
            </li>
            <li>›</li>
            <li>
              <a
                href={`/${ad.cityLabel}`}
                className="text-blue-500 hover:underline"
              >
                {ad.city}
              </a>
            </li>
            <li>›</li>
            <li>
              <a
                href={`/${ad.cityLabel}/${ad.category}`}
                className="text-blue-500 hover:underline"
              >
                {categoryOptions.find((c) => c.key === ad.category)?.label ||
                  ad.category}
              </a>
            </li>
            <li>›</li>
            <li className="text-gray-500 truncate max-w-full overflow-hidden min-w-0 flex-1">
              {ad.title}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 text-neutral-800">
          {/* Левая часть: фото и основные данные */}
          <div className="flex-1 space-y-6 lg:max-w-2xl">
            <h1 className="text-2xl sm:text-3xl text-neutral-800 font-medium mb-6 sm:mb-8 line-clamp-2 max-w-full overflow-hidden break-words">
              {ad.title}
            </h1>

            <PhotoSlider
              images={photos.map(
                (src) =>
                  `https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                    src || 'default.jpg'
                  }`
              )}
            />

            {ad.description && ad.description.trim() && (
              <p className="text-sm sm:text-base mb-4 break-words">
                {ad.description}
              </p>
            )}

            {ad.details && ad.details.trim() && (
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  Детали
                </h2>
                <p className="text-sm sm:text-base whitespace-pre-line break-words">
                  {ad.details}
                </p>
              </div>
            )}
          </div>

          {/* Правая часть: карточка с ценой, контактами, локацией */}
          <aside className="w-full lg:w-1/3 lg:px-8 shrink-0 space-y-4">
            {ad.price !== undefined && (
              <div className="p-4 border border-violet-400 rounded-md">
                <div className="text-2xl sm:text-3xl font-bold break-all max-w-full">
                  {ad.price.toLocaleString('ru-RU')}{' '}
                  {getCurrencySymbol(ad.currency)}
                </div>
              </div>
            )}

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Продавец
              </h3>
              <div className="flex items-start space-x-3 py-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${
                      ad.seller.avatar || '765-default-avatar.png'
                    }`}
                    alt="Аватар продавца"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold break-words">
                    {ad.seller.name}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starPos = idx + 1;
                      const fillPercent = Math.min(
                        Math.max((ad.seller.rating - (starPos - 1)) * 100, 0),
                        100
                      );
                      return (
                        <div key={idx} className="relative w-4 h-4">
                          <OutlineStarIcon className="w-4 h-4 text-yellow-400" />
                          {fillPercent > 0 && (
                            <SolidStarIcon
                              className="absolute top-0 left-0 w-4 h-4 text-yellow-400 overflow-hidden"
                              style={{
                                clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                    <span className="text-xs sm:text-sm text-neutral-600 ml-1">
                      {ad.seller.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {ad.seller.contact.phone && (
                  <a
                    href={`tel:${ad.seller.contact.phone}`}
                    className="text-sm sm:text-base text-violet-500 hover:underline block break-all"
                  >
                    📞 {ad.seller.contact.phone}
                  </a>
                )}
                {ad.seller.contact.email && (
                  <a
                    href={`mailto:${ad.seller.contact.email}`}
                    className="text-sm sm:text-base text-violet-500 hover:underline block break-all"
                  >
                    ✉️ {ad.seller.contact.email}
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Локация</h3>
              <p className="text-sm sm:text-base mb-3">
                {ad.city}
                {ad.address ? `, ${ad.address}` : ''}
              </p>
              <button
                onClick={() => setIsMapModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors font-medium"
              >
                <MapPinIcon className="w-4 h-4" />
                Посмотреть на карте
              </button>
            </div>

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Дата размещения
              </h3>
              <p className="text-sm sm:text-base">
                {new Date(ad.datePosted).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </aside>
        </div>

        {/* Блок с похожими объявлениями */}
        {similarAds && similarAds.length > 0 && (
          <section className="my-8 text-neutral-800">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Похожие объявления
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarAds.slice(0, 8).map((x) => (
                <GalleryAdCard key={x.id} ad={x} />
              ))}
            </div>
          </section>
        )}

        {/* Модальное окно карты */}
        <MapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          ad={ad}
        />
      </div>
    </Suspense>
  );
}
