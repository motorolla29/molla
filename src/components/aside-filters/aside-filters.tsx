'use client';

import { useLocationStore } from '@/store/useLocationStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import LocationModal from '../location-modal/location-modal';
import { categoryOptions } from '@/const';

interface AsideFiltersProps {
  category: string | null;
}

export default function AsideFilters({ category }: AsideFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    cityLabel: storeCityLabel,
    cityName: storeCityName,
    cityNamePreposition: storeCityPrep,
    lat: storeLat,
    lon: storeLon,
    setLocation,
  } = useLocationStore();

  // Локальное состояние для мобильных фильтров
  const [cityLabel, setCityLabel] = useState<string | null>(
    storeCityLabel ?? null
  );
  const [cityName, setCityName] = useState<string | null>(
    storeCityName ?? null
  );
  const [cityPrep, setCityPrep] = useState<string | null>(
    storeCityPrep ?? null
  );
  const [lat, setLat] = useState<number | null>(storeLat ?? null);
  const [lon, setLon] = useState<number | null>(storeLon ?? null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [categoryKey, setCategoryKey] = useState<string | null>(category);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | '7' | '24'>('all');
  const [isResetting, setIsResetting] = useState(false);
  const prevStoreRef = useRef({
    cityLabel: storeCityLabel,
    cityName: storeCityName,
    cityPrep: storeCityPrep,
    lat: storeLat,
    lon: storeLon,
  });

  // Инициализация из URL при монтировании
  useEffect(() => {
    const sp = Object.fromEntries(searchParams.entries());
    if (sp.minPrice) setMinPrice(sp.minPrice);
    if (sp.maxPrice) setMaxPrice(sp.maxPrice);
    if (sp.categoryKey) setCategoryKey(sp.categoryKey);
    setIsVip(!!sp.vip);
    if (sp.time === '7' || sp.time === '24') {
      setTimeFilter(sp.time);
    } else {
      setTimeFilter('all');
    }
    // Город из стора уже синхронизирован в useEffect ниже
  }, []);

  const displayCity =
    cityLabel === 'russia' ? 'Все города' : cityName || 'Город не выбран';

  const appliedCategoryKey =
    searchParams.get('categoryKey') ?? category ?? null;

  // Применённые фильтры из текущего URL
  const appliedFilters = useMemo(() => {
    const time = searchParams.get('time');
    return {
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      isVip: searchParams.has('vip'),
      timeFilter: time === '7' || time === '24' ? time : 'all',
    };
  }, [searchParams]);

  const hasUnsavedChanges =
    minPrice !== appliedFilters.minPrice ||
    maxPrice !== appliedFilters.maxPrice ||
    isVip !== appliedFilters.isVip ||
    timeFilter !== appliedFilters.timeFilter ||
    categoryKey !== appliedCategoryKey ||
    cityLabel !== (storeCityLabel ?? null) ||
    cityName !== (storeCityName ?? null) ||
    cityPrep !== (storeCityPrep ?? null) ||
    lat !== (storeLat ?? null) ||
    lon !== (storeLon ?? null);

  const hasAppliedFilters =
    appliedFilters.minPrice !== '' ||
    appliedFilters.maxPrice !== '' ||
    appliedFilters.isVip ||
    appliedFilters.timeFilter !== 'all';

  const buildPath = (overrides?: {
    cityLabel?: string | null;
    categoryKey?: string | null;
  }) => {
    const targetCity = overrides?.cityLabel ?? cityLabel;
    const targetCategory = overrides?.categoryKey ?? categoryKey;
    const segments = [];
    if (targetCity) segments.push(targetCity);
    if (targetCategory) segments.push(targetCategory);
    return '/' + segments.join('/');
  };

  const pushFilters = (
    overrides?: Partial<{
      minPrice: string;
      maxPrice: string;
      isVip: boolean;
      timeFilter: 'all' | '7' | '24';
      cityLabel: string | null;
      categoryKey: string | null;
    }>
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextMinPrice = overrides?.minPrice ?? minPrice;
    const nextMaxPrice = overrides?.maxPrice ?? maxPrice;
    const nextIsVip = overrides?.isVip ?? isVip;
    const nextTimeFilter = overrides?.timeFilter ?? timeFilter;

    if (nextMinPrice) params.set('minPrice', nextMinPrice);
    else params.delete('minPrice');

    if (nextMaxPrice) params.set('maxPrice', nextMaxPrice);
    else params.delete('maxPrice');

    if (nextIsVip) params.set('vip', '1');
    else params.delete('vip');

    if (nextTimeFilter && nextTimeFilter !== 'all') {
      params.set('time', nextTimeFilter);
    } else {
      params.delete('time');
    }

    const queryString = params.toString();
    const path = buildPath({
      cityLabel: overrides?.cityLabel,
      categoryKey: overrides?.categoryKey,
    });
    router.push(path + (queryString ? `?${queryString}` : ''));
  };

  // Синхронизация с глобальным стором + автоприменение при смене города снаружи
  useEffect(() => {
    const changed =
      storeCityLabel !== prevStoreRef.current.cityLabel ||
      storeCityName !== prevStoreRef.current.cityName ||
      storeCityPrep !== prevStoreRef.current.cityPrep ||
      storeLat !== prevStoreRef.current.lat ||
      storeLon !== prevStoreRef.current.lon;

    setCityLabel(storeCityLabel ?? null);
    setCityName(storeCityName ?? null);
    setCityPrep(storeCityPrep ?? null);
    setLat(storeLat ?? null);
    setLon(storeLon ?? null);

    if (changed) {
      // Не перезаписываем URL при инициализации, чтобы сохранить параметры из ссылки
      // pushFilters вызывается только при явном изменении города пользователем
      prevStoreRef.current = {
        cityLabel: storeCityLabel,
        cityName: storeCityName,
        cityPrep: storeCityPrep,
        lat: storeLat,
        lon: storeLon,
      };
    }
  }, [
    storeCityLabel,
    storeCityName,
    storeCityPrep,
    storeLat,
    storeLon,
    searchParams,
  ]);

  const handleApply = () => {
    if (cityLabel && cityName && cityPrep) {
      setLocation(cityLabel, cityName, cityPrep, lat, lon);
    }
    pushFilters();
  };

  const handleReset = () => {
    setIsResetting(true);

    // Сначала удаляем параметры из URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('vip');
    params.delete('time');

    // При сбросе переходим на страницу города без категории
    const cityPath = cityLabel ? `/${cityLabel}` : '/russia';
    const qs = params.toString();
    router.push(cityPath + (qs ? `?${qs}` : ''));

    // Снимаем флаг через 500ms, чтобы избежать мерцания кнопок
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <aside className="hidden lg:flex w-80 xl:w-72 2xl:w-80 h-fit flex-col shrink-0 bg-amber-100 p-4 rounded-xl max-w-[300px]">
      {/* Город */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Город</h2>
        <button
          onClick={() => setShowLocationModal(true)}
          className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 bg-white hover:bg-gray-50"
        >
          <span className="truncate">{displayCity}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      {/* Цена */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Цена</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onWheel={(e) => {
              (e.target as HTMLInputElement).blur();
              e.preventDefault();
            }}
            className="w-1/2 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-amber-500"
            min={0}
          />
          <input
            type="number"
            placeholder="До"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onWheel={(e) => {
              (e.target as HTMLInputElement).blur();
              e.preventDefault();
            }}
            className="w-1/2 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-amber-500"
            min={0}
          />
        </div>
      </div>
      {/* Категория */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Категория</h2>
        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.slice(0, 4).map((opt) => {
            const selected = categoryKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setCategoryKey(selected ? null : opt.key)}
                className={`flex items-center px-3 py-2 border rounded-md ${
                  selected
                    ? 'bg-violet-100 border-violet-400'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <img
                  src={`https://ik.imagekit.io/motorolla29/molla/icons/${opt.key}.png`}
                  alt={opt.label}
                  className="w-5 h-5 mr-2"
                />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* VIP */}
      <div className="flex items-center mb-4">
        <input
          id="vip-aside"
          type="checkbox"
          checked={isVip}
          onChange={(e) => setIsVip(e.target.checked)}
          className="h-4 w-4 text-violet-500 border-gray-300 rounded"
        />
        <label htmlFor="vip-aside" className="ml-2 select-none cursor-pointer">
          Только VIP объявления
        </label>
      </div>
      {/* Время */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Размещено</h2>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timeFilterAside"
              value="all"
              checked={timeFilter === 'all'}
              onChange={() => setTimeFilter('all')}
              className="h-4 w-4 text-violet-500 border-gray-300"
            />
            <span className="ml-2">За всё время</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timeFilterAside"
              value="7"
              checked={timeFilter === '7'}
              onChange={() => setTimeFilter('7')}
              className="h-4 w-4 text-violet-500 border-gray-300"
            />
            <span className="ml-2">За 7 дней</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timeFilterAside"
              value="24"
              checked={timeFilter === '24'}
              onChange={() => setTimeFilter('24')}
              className="h-4 w-4 text-violet-500 border-gray-300"
            />
            <span className="ml-2">За 24 часа</span>
          </label>
        </div>
      </div>
      {/* Кнопки */}
      <div className="flex flex-col gap-2 pt-2">
        {hasUnsavedChanges && !isResetting && (
          <button
            onClick={handleApply}
            className="text-white bg-violet-500 rounded-md hover:bg-violet-600 active:bg-violet-700 w-full h-10"
          >
            Применить
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="text-neutral-800 bg-neutral-200 rounded-md w-full h-10 disabled:opacity-50"
        >
          Сбросить фильтры
        </button>
      </div>
      {/* Модал выбора города */}
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onSelect={(label, nameNom, namePrep, selLat, selLon) => {
            setCityLabel(label);
            setCityName(nameNom);
            setCityPrep(namePrep);
            setLat(selLat);
            setLon(selLon);
            setLocation(label, nameNom, namePrep, selLat, selLon);
            prevStoreRef.current = {
              cityLabel: label,
              cityName: nameNom,
              cityPrep: namePrep,
              lat: selLat,
              lon: selLon,
            };
            pushFilters({
              cityLabel: label,
            });
            setShowLocationModal(false);
          }}
        />
      )}
    </aside>
  );
}
