'use client';

import React from 'react';
import { AdBase } from '@/types/ad';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card'; // если нужна карточка похожих
import { useRouter } from 'next/navigation';
import { mockAds } from '@/data/mockAds';
import { categoryOptions } from '@/const';

interface AdClientProps {
  ad: AdBase;
}

export default function AdClient({ ad }: AdClientProps) {
  const router = useRouter();

  // Здесь можно добавить логику клиента: реакции на клики, вызов API для чата и т.п.
  // Например, обработка кнопки «Связаться с продавцом» или «Похожие объявления».

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumbs можно сюда вынести, если нужно */}
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/" className="text-blue-500 hover:underline">
              Главная
            </a>
          </li>
          <li>/</li>
          <li>
            <a
              href={`/${ad.cityLabel}`}
              className="text-blue-500 hover:underline"
            >
              {ad.city}
            </a>
          </li>
          <li>/</li>
          <li>
            <a
              href={`/${ad.cityLabel}/${ad.category}`}
              className="text-blue-500 hover:underline"
            >
              {/* здесь может быть метка категории на русском */}
              {categoryOptions.find((c) => c.key === ad.category)?.label ||
                ad.category}
            </a>
          </li>
          <li>›</li>
          <li className="text-gray-500 line-clamp-1">{ad.title}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold mb-4">{ad.title}</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Левая часть: фото и основные данные */}
        <div className="flex-1">
          {/* Фото: можно галерею */}
          {ad.photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {ad.photos.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${ad.title} фото ${idx + 1}`}
                  className="w-full h-auto object-cover rounded-md"
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500 mb-4">
              Нет фото
            </div>
          )}

          <p className="mb-4">{ad.description}</p>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Детали</h2>
            <p className="whitespace-pre-line">{ad.details}</p>
          </div>
        </div>

        {/* Правая часть: карточка с ценой, контактами, локацией */}
        <aside className="w-full md:w-1/3 flex-shrink-0 space-y-4">
          {ad.price !== undefined && (
            <div className="p-4 border rounded-md">
              <span className="text-2xl font-bold text-green-600">
                {ad.price.toLocaleString('ru-RU')} {ad.currency || 'RUB'}
              </span>
            </div>
          )}

          <div className="p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Продавец</h3>
            <p>{ad.seller.name}</p>
            <p>Рейтинг: {ad.seller.rating.toFixed(1)}</p>
            {/* Кнопка по типу контакта */}
            {ad.seller.contact.type === 'phone' && (
              <a
                href={`tel:${ad.seller.contact.value}`}
                className="text-blue-500 hover:underline"
              >
                Позвонить: {ad.seller.contact.value}
              </a>
            )}
            {ad.seller.contact.type === 'email' && (
              <a
                href={`mailto:${ad.seller.contact.value}`}
                className="text-blue-500 hover:underline"
              >
                Написать: {ad.seller.contact.value}
              </a>
            )}
            {ad.seller.contact.type === 'chat' && (
              <button
                onClick={() => {
                  // например, открыть чат
                  alert(`Открыть чат с ${ad.seller.name}`);
                }}
                className="text-blue-500 hover:underline"
              >
                Открыть чат
              </button>
            )}
          </div>

          <div className="p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Локация</h3>
            <p>
              {ad.city}, {ad.address}
            </p>
            {/* Можно интегрировать карту, если нужно */}
          </div>

          <div className="p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Дата размещения</h3>
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

      {/* Блок с похожими объявлениями: можно отрендерить несколько случайных из mockAds той же категории и города */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Похожие объявления</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAds
            .filter(
              (x) =>
                x.category === ad.category &&
                x.cityLabel === ad.cityLabel &&
                x.id !== ad.id
            )
            .slice(0, 3)
            .map((x) => (
              <GalleryAdCard key={x.id} ad={x} />
            ))}
        </div>
      </section>
    </div>
  );
}
