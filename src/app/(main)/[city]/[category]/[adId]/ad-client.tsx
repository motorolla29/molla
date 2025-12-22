'use client';

import { Suspense } from 'react';
import { AdBase } from '@/types/ad';
import { categoryOptions } from '@/const';
import { getCurrencySymbol } from '@/utils';
import PhotoSlider from '@/components/photo-slider/photo-slider';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';

interface AdClientProps {
  ad: AdBase;
  similarAds?: AdBase[];
}

export default function AdClient({ ad, similarAds }: AdClientProps) {
  const photos = ad.photos.length > 0 ? ad.photos : ['default.jpg'];

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
            <h1 className="text-3xl text-neutral-800 font-medium mb-8 line-clamp-2 max-w-full overflow-hidden break-words">
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

            <p className="mb-4 break-words">{ad.description}</p>

            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Детали</h2>
              <p className="whitespace-pre-line break-words">{ad.details}</p>
            </div>
          </div>

          {/* Правая часть: карточка с ценой, контактами, локацией */}
          <aside className="w-full lg:w-1/3 lg:px-8 shrink-0 space-y-4">
            {ad.price !== undefined && (
              <div className="p-4 border border-violet-400 rounded-md">
                <span className="text-3xl font-bold ">
                  {ad.price.toLocaleString('ru-RU')}{' '}
                  {getCurrencySymbol(ad.currency)}
                </span>
              </div>
            )}

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-xl font-semibold mb-2">Продавец</h3>
              <p className="font-semibold">{ad.seller.name}</p>
              <p>Рейтинг: {ad.seller.rating.toFixed(1)}</p>
              <div className="space-y-1">
                {ad.seller.contact.phone && (
                  <a
                    href={`tel:${ad.seller.contact.phone}`}
                    className="text-violet-500 hover:underline block"
                  >
                    📞 {ad.seller.contact.phone}
                  </a>
                )}
                {ad.seller.contact.email && (
                  <a
                    href={`mailto:${ad.seller.contact.email}`}
                    className="text-violet-500 hover:underline block"
                  >
                    ✉️ {ad.seller.contact.email}
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-xl font-semibold mb-2">Локация</h3>
              <p>
                {ad.city}, {ad.address}
              </p>
            </div>

            <div className="p-4 border border-amber-300 rounded-md">
              <h3 className="text-xl font-semibold mb-2">Дата размещения</h3>
              <p>
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
            <h2 className="text-xl font-semibold mb-4">Похожие объявления</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarAds.slice(0, 8).map((x) => (
                <GalleryAdCard key={x.id} ad={x} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Suspense>
  );
}
