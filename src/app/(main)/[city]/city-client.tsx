'use client';

import { useEffect, useState } from 'react';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import { categoryOptions, getCategoryLabelByKey } from '@/const';
import Link from 'next/link';
import { mockAds } from '@/data/mockAds';
import AsideFilters from '@/components/aside-filters/aside-filters';
import TopPanel from '@/components/top-panel/top-panel';

interface AdItem {
  id: string;
  title: string;
  description: string;
  price?: number;
  categoryKey?: string /* остальные поля */;
}

interface CityClientProps {
  cityLabel: string;
  cityName: string;
  cityNamePrep: string;
}

export default function CityClient({
  cityLabel,
  cityName,
  cityNamePrep,
}: CityClientProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Фильтры в состоянии:
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sort, setSort] = useState<string>('default');
  const [category, setCategory] = useState<string>(''); // пусто = все категории

  // При изменении фильтров или города делаем запрос к API
  useEffect(() => {
    async function fetchAds() {
      setLoading(true);
      // Сформировать query-параметры
      const params = new URLSearchParams();
      params.set('city', cityLabel);
      if (category) params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sort) params.set('sort', sort);
      const res = await fetch(`/api/ads?${params.toString()}`);
      if (res.ok) {
        const data: AdItem[] = await res.json();
        setAds(data);
      } else {
        setAds([]);
        setAds(mockAds);
      }
      setLoading(false);
    }
    fetchAds();
  }, [cityLabel, category, minPrice, maxPrice, sort]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-blue-500 hover:underline">
              Главная
            </Link>
          </li>
          <li>›</li>
          <li className="text-gray-500">Объявления в {cityNamePrep}</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-medium mb-4">Объявления в {cityNamePrep}</h1>

      <div className="flex gap-6">
        {/* Sidebar - фильтры*/}
        <AsideFilters
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />

        {/* Основной блок с объявлениями */}
        <main className="flex-1">
          <TopPanel sort={sort} setSort={setSort} />

          {loading ? (
            <div>Загрузка...</div>
          ) : ads.length === 0 ? (
            <p>Нет объявлений по выбранным параметрам.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {ads.map((ad) => (
                <GalleryAdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
