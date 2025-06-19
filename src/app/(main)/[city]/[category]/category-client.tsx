'use client';

import { useEffect, useState } from 'react';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import Link from 'next/link';
import TopPanel from '@/components/top-panel/top-panel';
import AsideFilters from '@/components/aside-filters/aside-filters';
import { mockAds } from '@/data/mockAds';

interface AdItem {
  id: string;
  title: string;
  description: string;
  price?: number;
  categoryKey?: string;
  cityLabel?: string;
  // ...другие поля
}

interface CategoryClientProps {
  cityLabel: string;
  cityName: string;
  cityNamePrep: string;
  categoryKey: string;
  categoryLabel: string;
}

export default function CategoryClient({
  cityLabel,
  cityName,
  cityNamePrep,
  categoryKey,
  categoryLabel,
}: CategoryClientProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  // состояние фильтров
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    async function fetchAds() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('city', cityLabel);
      params.set('category', categoryKey);
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
  }, [cityLabel, categoryKey, minPrice, maxPrice, sort]);

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
          <li>
            <Link
              href={`/${cityLabel}`}
              className="text-blue-500 hover:underline"
            >
              {cityName}
            </Link>
          </li>
          <li>›</li>
          <li className="text-gray-500">{categoryLabel}</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-medium mb-4">
        {categoryLabel} в {cityNamePrep}
      </h1>

      <div className="flex gap-6">
        <AsideFilters
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />

        {/* Основной блок */}
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
