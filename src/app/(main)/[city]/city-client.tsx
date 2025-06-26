'use client';

import { useEffect, useState } from 'react';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import { categoryOptions, getCategoryLabelByKey } from '@/const';
import Link from 'next/link';
import { mockAds } from '@/data/mockAds';
import AsideFilters from '@/components/aside-filters/aside-filters';
import TopPanel from '@/components/top-panel/top-panel';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import { useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';

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
  lat: number | null;
  lon: number | null;
}

export default function CityClient({
  cityLabel,
  cityName,
  cityNamePrep,
  lat = null,
  lon = null,
}: CityClientProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const setLocation = useLocationStore((s) => s.setLocation);

  useEffect(() => {
    setLocation(cityLabel, cityName, cityNamePrep, lat, lon);
  }, [cityLabel, cityName, cityNamePrep, lat, lon, setLocation]);

  // При изменении фильтров или города делаем запрос к API
  useEffect(() => {
    async function fetchAds() {
      setLoading(true);
      const params = new URLSearchParams();

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
  }, [cityLabel, searchParams]);

  return (
    <div className="container text-stone-800 mx-auto px-4 pb-6">
      <TopSearchPanel categoryKey={null} categoryName={null} />
      <TopSearchPanelMobile
        categoryKey={null}
        categoryName={null}
        setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
      />
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

      <h1 className="text-3xl font-medium mb-5">
        Объявления в {cityNamePrep}
        {searchParams.get('search') && (
          <span className="text-stone-400">
            {' '}
            (по запросу «
            <span className="text-stone-800">{searchParams.get('search')}</span>
            »):
          </span>
        )}
      </h1>

      <div className="flex gap-6">
        {/* Sidebar - фильтры*/}
        <AsideFilters category={null} />

        {/* Основной блок с объявлениями */}
        <main className="flex-1">
          <TopPanel />

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
      {/* Модал/Overlay с фильтрами во весь экран для мобильных */}
      {mobileFiltersVisible && (
        <FiltersMobile
          category={null}
          setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
        />
      )}
    </div>
  );
}
