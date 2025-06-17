'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocationStore } from '@/store/useLocationStore';

interface Suggestion {
  city: string;
  lat: number;
  lon: number;
}

interface LocationModalProps {
  onClose: () => void;
  onSelect: (city: string, lat: number, lon: number) => void;
}

async function fetchCitySuggestions(query: string): Promise<Suggestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
  if (!apiKey) {
    console.warn('Yandex API key missing');
    return [];
  }

  const term = query.trim();
  if (term.length < 2) return [];

  const url =
    `https://geocode-maps.yandex.ru/1.x?apikey=${apiKey}` +
    `&format=json&geocode=${encodeURIComponent(term)}` +
    `&kind=locality&results=10&lang=ru_RU`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Yandex Geocoder error:', res.status);
      return [];
    }

    const data = await res.json();
    const members = data.response?.GeoObjectCollection?.featureMember || [];
    const items: Suggestion[] = [];

    for (const member of members) {
      const geoObj = member.GeoObject;

      // Проверка на Россию
      let countryCode: string | null = null;
      try {
        countryCode =
          geoObj.metaDataProperty.GeocoderMetaData.Address.country_code;
      } catch {}
      if (!countryCode) {
        try {
          countryCode =
            geoObj.metaDataProperty.GeocoderMetaData.Address.Details.Country
              .CountryNameCode;
        } catch {}
      }
      if (countryCode !== 'RU') continue;

      // Название города
      let cityName: string | null = null;
      try {
        cityName =
          geoObj.metaDataProperty.GeocoderMetaData.Address.Details.Country
            .Locality.LocalityName;
      } catch {}
      if (!cityName) {
        cityName = geoObj.name || null;
      }
      if (!cityName || cityName.length < 2) continue;

      // Координаты
      let lat = 0,
        lon = 0;
      try {
        const pos = geoObj.Point.pos; // "lon lat"
        const [lonStr, latStr] = pos.split(' ');
        lon = parseFloat(lonStr);
        lat = parseFloat(latStr);
      } catch {}

      items.push({ city: cityName, lat, lon });
    }

    const unique = Array.from(new Map(items.map((i) => [i.city, i])).values());
    return unique;
  } catch (e) {
    console.error('fetchCitySuggestions error:', e);
    return [];
  }
}

export default function LocationModal({
  onClose,
  onSelect,
}: LocationModalProps) {
  const {
    city: currentCity,
    lat: currentLat,
    lon: currentLon,
  } = useLocationStore();

  // Инпут
  const [input, setInput] = useState('');

  // Подсказки
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Выбранный город (локально), но еще не применён
  const [previewCity, setPreviewCity] = useState(currentCity);
  const [previewLat, setPreviewLat] = useState(currentLat);
  const [previewLon, setPreviewLon] = useState(currentLon);

  const modalRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>();

  useEffect(() => {
    // Блокируем прокрутку при монтировании
    document.body.classList.add('overflow-hidden');

    return () => {
      // Возвращаем прокрутку при размонтировании
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  // Закрытие по клику вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Дебаунс подсказок
  useEffect(() => {
    const term = input.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!term || term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const items = await fetchCitySuggestions(term);
        setSuggestions(items);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('Ошибка при получении подсказок');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  // Выбор подсказки
  const handleSelectSuggestion = (item: Suggestion) => {
    setPreviewCity(item.city);
    setPreviewLat(item.lat);
    setPreviewLon(item.lon);
    setInput('');
    setSuggestions([]);
    setError(null);
  };

  // Применение
  const handleApply = () => {
    if (previewCity && previewLat != null && previewLon != null) {
      onSelect(previewCity, previewLat, previewLon);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md mx-4 p-4 shadow-2xl"
      >
        <h2 className="text-lg font-medium mb-4">Выберите город</h2>

        {/* Текущий город */}
        <div className="mb-4">
          <span className="text-sm text-stone-600">Текущий город:</span>
          <div className="mt-1 px-3 py-2 bg-gray-100 rounded-md text-stone-800">
            {previewCity || 'Не задан'}
          </div>
        </div>

        {/* Поле ввода */}
        <div className="relative mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Начните вводить город"
            className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 outline-none"
          />
          {loading && (
            <div className="absolute right-4.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              ...
            </div>
          )}
          {/* Подсказки */}
          {suggestions.length > 0 && (
            <ul className="absolute w-full top-full max-h-48 overflow-auto border border-gray-200 rounded-md bg-white z-50">
              {suggestions.map((item, idx) => (
                <li
                  key={`${item.city}-${idx}`}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {item.city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ошибка */}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* Если ничего не найдено */}
        {!loading && input.trim().length >= 2 && suggestions.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">Ничего не найдено</p>
        )}

        {/* Кнопки */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
