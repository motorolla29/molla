'use client';

import { useEffect, useState } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import { loadCitiesData, findNearestCity } from '@/utils';
import { useLocationStore } from '@/store/useLocationStore';

export interface AdLocationValue {
  cityLabel: string | null;
  cityName: string | null;
  cityNamePreposition: string | null;
  lat: number | null;
  lng: number | null;
  address: string;
}

interface AdLocationSelectorProps {
  profileCity?: string | null;
  onChange?: (value: AdLocationValue) => void;
}

export default function AdLocationSelector({
  profileCity,
  onChange,
}: AdLocationSelectorProps) {
  const locationStore = useLocationStore();

  const [cityLabel, setCityLabel] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [cityNamePreposition, setCityNamePreposition] = useState<string | null>(
    null
  );
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState('');

  // Инициализация города
  useEffect(() => {
    async function initCity() {
      const cities = await loadCitiesData();

      // 1) Профильный город, если указан
      if (profileCity) {
        const fromProfile = cities.find((c) => {
          const nom = c.namecase?.nominative ?? c.name;
          return (
            nom && nom.trim().toLowerCase() === profileCity.trim().toLowerCase()
          );
        });
        if (fromProfile && fromProfile.coords) {
          setCityLabel(fromProfile.label ?? null);
          const nom =
            fromProfile.namecase?.nominative ?? fromProfile.name ?? null;
          const prep =
            fromProfile.namecase?.prepositional ??
            fromProfile.namecase?.nominative ??
            fromProfile.name ??
            null;
          setCityName(nom);
          setCityNamePreposition(prep);
          setLat(fromProfile.coords.lat ?? null);
          setLng(fromProfile.coords.lon ?? null);
          return;
        }
      }

      // 2) Из стора локации
      if (locationStore.cityLabel && locationStore.lat && locationStore.lon) {
        setCityLabel(locationStore.cityLabel ?? null);
        setCityName(locationStore.cityName ?? null);
        setCityNamePreposition(locationStore.cityNamePreposition ?? null);
        setLat(locationStore.lat ?? null);
        setLng(locationStore.lon ?? null);
        return;
      }

      // 3) Фолбэк: первая запись из JSON (как дефолт)
      const first = cities[0];
      if (first && first.coords) {
        setCityLabel(first.label ?? null);
        const nom = first.namecase?.nominative ?? first.name ?? null;
        const prep =
          first.namecase?.prepositional ??
          first.namecase?.nominative ??
          first.name ??
          null;
        setCityName(nom);
        setCityNamePreposition(prep);
        setLat(first.coords.lat ?? null);
        setLng(first.coords.lon ?? null);
      }
    }

    initCity();
  }, [
    profileCity,
    locationStore.cityLabel,
    locationStore.cityName,
    locationStore.lat,
    locationStore.lon,
    locationStore.cityNamePreposition,
  ]);

  // Репортим текущее значение наружу
  useEffect(() => {
    onChange?.({
      cityLabel,
      cityName,
      cityNamePreposition,
      lat,
      lng,
      address,
    });
  }, [cityLabel, cityName, cityNamePreposition, lat, lng, address, onChange]);

  // Обработка изменения центра карты (пин по центру)
  const handleMapCenterChange = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);

    try {
      const nearest = await findNearestCity(newLat, newLng);
      if (
        nearest &&
        nearest.label &&
        nearest.coords &&
        nearest.label !== cityLabel
      ) {
        const nom = nearest.namecase?.nominative ?? nearest.name;
        const prep =
          nearest.namecase?.prepositional ??
          nearest.namecase?.nominative ??
          nearest.name;
        setCityLabel(nearest.label);
        setCityName(nom ?? null);
        setCityNamePreposition(prep ?? null);
      }
    } catch (e) {
      console.warn('Не удалось подобрать ближайший город:', e);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-3">
      <h2 className="text-lg font-semibold">Локация</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Город</label>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-800">{cityName || 'Не выбран'}</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Адрес (улица, дом)
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Например, ул. Ленина, д. 10"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="mt-3 h-64 rounded-xl overflow-hidden border border-gray-200 relative">
        {lat != null && lng != null ? (
          <YMaps
            query={{
              apikey: process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY,
            }}
          >
            <div className="relative w-full h-full">
              <Map
                state={{ center: [lat, lng], zoom: 13 }}
                width="100%"
                height="100%"
                options={{
                  suppressMapOpenBlock: true,
                  minZoom: 3,
                  maxZoom: 18,
                }}
                onBoundsChange={(e: any) => {
                  const center = e.get('target').getCenter();
                  if (center && center.length === 2) {
                    handleMapCenterChange(center[0], center[1]);
                  }
                }}
              />
              {/* Пин по центру */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                <div className="w-6 h-6 bg-violet-500 rounded-full border-2 border-white shadow-lg" />
                <div className="w-0.5 h-4 bg-violet-500 mx-auto" />
              </div>
            </div>
          </YMaps>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            Загрузка карты...
          </div>
        )}
      </div>
    </section>
  );
}
