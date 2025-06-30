'use client';

import { useEffect, useState } from 'react';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import { categoryOptions, getCategoryLabelByKey } from '@/const';
import { FidgetSpinner } from 'react-loader-spinner';
import Link from 'next/link';
import { mockAds } from '@/data/mockAds';
import AsideFilters from '@/components/aside-filters/aside-filters';
import TopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import { useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import GalleryTopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import { AdBase } from '@/types/ad';

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
  const [ads, setAds] = useState<AdBase[]>([]);
  const [viewType, setViewType] = useState('default');
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
        const data: AdBase[] = await res.json();
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
    <div className="container text-neutral-800 mx-auto px-4 pb-6">
      <TopSearchPanel categoryKey={null} categoryName={null} />
      <TopSearchPanelMobile
        categoryKey={null}
        categoryName={null}
        setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
      />
      {/* Breadcrumbs */}
      <nav className="text-xs sm:text-sm mb-4" aria-label="Breadcrumb">
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

      <h1 className="text-xl sm:text-3xl font-medium mb-5">
        Объявления в {cityNamePrep}
        {searchParams.get('search') && (
          <span className="text-neutral-400">
            {' '}
            (по запросу «
            <span className="text-neutral-800">
              {searchParams.get('search')}
            </span>
            »):
          </span>
        )}
      </h1>

      <div className="flex gap-6">
        {/* Sidebar - фильтры*/}
        <AsideFilters category={null} />

        {/* Основной блок с объявлениями */}
        <main className="flex-1">
          <GalleryTopPanel viewType={viewType} setViewType={setViewType} />

          {loading ? (
            <div className="w-full flex justify-center mt-30 sm:mt-20">
              <FidgetSpinner
                ariaLabel="fidget-spinner-loading"
                width={'100%'}
                height={'100%'}
                wrapperClass="w-16 sm:w-20"
                backgroundColor="#A684FF"
                ballColors={['#D5FF4D', '#FE9A00', '#737373']}
              />
            </div>
          ) : ads.length === 0 ? (
            <div className="w-full flex flex-col justify-center items-center mt-20 text-neutral-500">
              <div className="flex flex-col justify-center items-center max-w-75">
                <img
                  className="w-16 md:w-20"
                  src="https://ik.imagekit.io/motorolla29/molla/icons/%D0%BD%D0%B8%D1%87%D0%B5%D0%B3%D0%BE-%D0%BD%D0%B5-%D0%BD%D0%B0%D0%B9%D0%B4%D0%B5%D0%BD%D0%BE-100.png"
                  alt="nothing-found"
                />
                <p className="text-sm md:text-base font-semibold text-center">
                  Нет объявлений по выбранным параметрам.
                </p>
              </div>
            </div>
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
