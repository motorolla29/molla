'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { mockAds } from '@/data/mockAds';

type Ad = {
  id: string;
  title: string;
  category: string; // e.g. 'goods', 'services', 'realestate', 'auto'
  photos?: string[];
  // другие поля...
};

export default function Home() {
  const isAuthenticated = false;

  // Состояния для фильтрации/поиска
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Состояние карты
  const [showFullMap, setShowFullMap] = useState(false);
  // Секции "Рекомендации" / "Свежие"
  const [activeTab, setActiveTab] = useState<'recommend' | 'fresh'>(
    'recommend'
  );

  const categoryOptions = [
    { key: 'goods', label: 'Товары' },
    { key: 'services', label: 'Услуги' },
    { key: 'realestate', label: 'Недвижимость' },
    { key: 'auto', label: 'Авто' },
  ];

  // Фильтрация списка по поиску и выбранным категориям
  const filteredAds = mockAds.filter((ad) => {
    const matchesSearch = ad.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(ad.category);
    return matchesSearch && matchesCategory;
  });

  // Разбить на рекомендации/свежие — здесь просто заглушка
  const recommendAds = filteredAds; // TODO: сортировка по рекомендациям
  const freshAds = filteredAds; // TODO: сортировка по дате

  // Функция переключения категории в фильтре
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER: поиск + фильтры + кнопка "Разместить объявление" */}
      <header className="bg-white sticky top-10 z-10">
        <div className="mx-auto py-3 flex items-center gap-2">
          {/* Иконка фильтров */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown((prev) => !prev)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Фильтры"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6 cursor-pointer"
              >
                <path d="M18.75 12.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM12 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 6ZM12 18a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 18ZM3.75 6.75h1.5a.75.75 0 1 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM5.25 18.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5ZM3 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3 12ZM9 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 12a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM9 15.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
              </svg>
            </button>
            {showFilterDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="p-2 text-sm font-medium text-gray-700">
                  Категории
                </div>
                <ul>
                  {categoryOptions.map((opt) => (
                    <li key={opt.key}>
                      <label className="flex items-center px-3 py-1 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedCategories.includes(opt.key)}
                          onChange={() => toggleCategory(opt.key)}
                        />
                        {opt.label}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end p-2">
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Поисковая строка */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Найти объявления..."
              className="w-full pl-4 pr-24 py-2 border outline-none border-gray-300 rounded-full focus:border-violet-300"
            />
            <button
              onClick={() => {
                /* при клике можно выполнять поиск или обновление списка */
              }}
              className="absolute outline-none right-0 top-0 h-full px-4 cursor-pointer bg-violet-400 text-white rounded-full hover:bg-violet-500"
            >
              Найти
            </button>
          </div>

          {/* Кнопка "Разместить объявление" */}
          <div>
            <Link
              href={isAuthenticated ? '/ad/create' : '/auth'}
              className="flex justify-center items-center ml-2 px-4 py-2 text-white bg-amber-500 rounded-md hover:bg-amber-600"
            >
              Разместить объявление
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="mx-auto px-4 py-6 space-y-6">
        {/* Мини-карта с пинами */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Карта объявлений</h2>
            <button
              onClick={() => setShowFullMap(true)}
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <MapPinIcon className="h-5 w-5" />
              Посмотреть на карте
            </button>
          </div>
          {/* Заглушка для мини-карты */}
          <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
            Мини-карта (здесь подключите компонент с Яндекс.Картой или Map)
          </div>
        </section>

        {/* Модалка/оверлей для полной карты */}
        {showFullMap && (
          <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative w-full h-full bg-white">
              <button
                onClick={() => setShowFullMap(false)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                aria-label="Закрыть"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
              {/* Здесь разместите ваш компонент карты на весь экран */}
              <div className="w-full h-full">
                Полная карта (здесь компонент с Яндекс.Картой)
              </div>
            </div>
          </div>
        )}

        {/* Секции "Рекомендации" и "Свежие" */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          {/* Таб переключения */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('recommend')}
              className={`px-4 py-2 -mb-px ${
                activeTab === 'recommend'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Рекомендации
            </button>
            <button
              onClick={() => setActiveTab('fresh')}
              className={`ml-4 px-4 py-2 -mb-px ${
                activeTab === 'fresh'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Свежие
            </button>
          </div>
          {/* Список объявлений */}
          <ul className="space-y-4">
            {(activeTab === 'recommend' ? recommendAds : freshAds).map((ad) => {
              // выбираем изображение: первая фотка или дефолт по категории
              const imgSrc =
                ad.photos && ad.photos.length > 0
                  ? ad.photos[0]
                  : `/images/default-ad-${ad.category}.jpg`; // разместите в public/images
              return (
                <li
                  key={ad.id}
                  className="flex bg-gray-50 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="w-32 h-24 flex-shrink-0">
                    <img
                      src={imgSrc}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-3">
                    <h3 className="text-lg font-medium text-gray-800">
                      {ad.title}
                    </h3>
                    {/* Доп. информация, например: цена, город и т.д. */}
                    <p className="text-sm text-gray-500">
                      Категория: {ad.category}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
