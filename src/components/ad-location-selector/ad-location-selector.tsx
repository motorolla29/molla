'use client';

import { useEffect, useState, useRef } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import { loadCitiesData, findNearestCity } from '@/utils';
import { useLocationStore } from '@/store/useLocationStore';
import CitySelectorModal from '@/components/city-selector-modal/city-selector-modal';

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
  initialValue?: AdLocationValue;
}

export default function AdLocationSelector({
  profileCity,
  onChange,
  initialValue,
}: AdLocationSelectorProps) {
  const locationStore = useLocationStore();

  const [cityLabel, setCityLabel] = useState<string | null>(
    initialValue?.cityLabel ?? null
  );
  const [cityName, setCityName] = useState<string | null>(
    initialValue?.cityName ?? null
  );
  const [cityNamePreposition, setCityNamePreposition] = useState<string | null>(
    initialValue?.cityNamePreposition ?? null
  );
  const [lat, setLat] = useState<number | null>(initialValue?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialValue?.lng ?? null);
  const [zoom, setZoom] = useState<number>(13);
  const [address, setAddress] = useState(initialValue?.address ?? '');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{ text: string; lat: number; lng: number }>
  >([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressDebounceTimer, setAddressDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Инициализация из initialValue
  useEffect(() => {
    if (initialValue && !isInitializedRef.current) {
      isInitializedRef.current = true;

      // Устанавливаем значения
      setCityLabel(initialValue.cityLabel);
      setCityName(initialValue.cityName);
      setCityNamePreposition(initialValue.cityNamePreposition);
      setAddress(initialValue.address);

      // Устанавливаем координаты из initialValue, если они есть
      if (initialValue.lat != null && initialValue.lng != null) {
        setLat(initialValue.lat);
        setLng(initialValue.lng);
        setZoom(16); // Увеличиваем зум для детального просмотра адреса
      }
    }
  }, [initialValue]);

  // Новые состояния для карты
  const [isMapOverlayVisible, setIsMapOverlayVisible] = useState(true);
  const [showAddressConfirmPopup, setShowAddressConfirmPopup] = useState(false);
  const [pendingAddressData, setPendingAddressData] = useState<{
    address: string;
    cityName?: string;
    cityLabel?: string;
    cityNamePreposition?: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Инициализация города
  useEffect(() => {
    // Не инициализируем город, если уже есть координаты из initialValue
    if (initialValue && initialValue.lat != null && initialValue.lng != null) {
      return;
    }

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
          setZoom(12); // Оптимальный зум для города
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
        setZoom(12); // Оптимальный зум для города
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
        setZoom(12); // Оптимальный зум для города
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
    initialValue,
  ]);

  // Обработка выбора города в модале
  const handleCitySelect = (
    selectedCityLabel: string,
    selectedCityName: string,
    selectedCityNamePreposition: string,
    selectedLat: number | null,
    selectedLon: number | null
  ) => {
    setCityLabel(selectedCityLabel);
    setCityName(selectedCityName);
    setCityNamePreposition(selectedCityNamePreposition);
    setLat(selectedLat);
    setLng(selectedLon);
    // Сбрасываем адрес при смене города
    setAddress('');
    // Не сбрасываем зум при выборе города, оставляем текущий или устанавливаем оптимальный для города
    setZoom(selectedLat && selectedLon ? 12 : 13);
    setIsMapOverlayVisible(true); // Закрываем карту оверлеем
    setShowLocationModal(false);
  };

  // Обработка изменения адреса с подсказками
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setShowAddressSuggestions(false);

    // Очищаем предыдущий таймер
    if (addressDebounceTimer) {
      clearTimeout(addressDebounceTimer);
    }

    // Загружаем подсказки с дебаунсом
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        loadAddressSuggestions(value);
      }, 300);
      setAddressDebounceTimer(timeoutId);
    } else {
      setAddressSuggestions([]);
    }
  };

  // Выбор подсказки адреса
  const handleAddressSuggestionSelect = (suggestion: {
    text: string;
    lat: number;
    lng: number;
  }) => {
    setAddress(suggestion.text);
    setLat(suggestion.lat);
    setLng(suggestion.lng);
    setZoom(16); // Увеличиваем зум для детального просмотра адреса
    setIsMapOverlayVisible(true); // Закрываем карту оверлеем
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  // Репортим текущее значение наружу
  useEffect(() => {
    if (isInitializedRef.current) {
      onChange?.({
        cityLabel,
        cityName,
        cityNamePreposition,
        lat,
        lng,
        address,
      });
    }
  }, [cityLabel, cityName, cityNamePreposition, lat, lng, address, onChange]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (addressDebounceTimer) {
        clearTimeout(addressDebounceTimer);
      }
    };
  }, [addressDebounceTimer]);

  // Загрузка подсказок адресов для выбранного города
  const loadAddressSuggestions = async (query: string) => {
    if (!query.trim() || !cityName) {
      console.log(
        '❌ Skipping suggestions - query:',
        query,
        'cityName:',
        cityName
      );
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
      if (!apiKey) return;

      // Используем Geocode API для поиска адресов в рамках города
      const searchQuery = `${cityName}, ${query}`;
      const url = `https://geocode-maps.yandex.ru/1.x?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(
        searchQuery
      )}&kind=house&results=10&lang=ru_RU`;

      const response = await fetch(url);
      const data = await response.json();

      const members = data.response?.GeoObjectCollection?.featureMember;

      if (members && members.length > 0) {
        const suggestions = members
          .map((member: any) => {
            const geoObject = member.GeoObject;
            const description = geoObject.description;
            const name = geoObject.name;
            const kind = geoObject.metaDataProperty?.GeocoderMetaData?.kind;
            const point = geoObject.Point;

            // Извлекаем координаты
            let lat = null,
              lng = null;
            if (point && point.pos) {
              const [lngStr, latStr] = point.pos.split(' ');
              lng = parseFloat(lngStr);
              lat = parseFloat(latStr);
            }

            // Проверяем тип объекта - должны быть только дома и улицы
            const allowedKinds = ['house', 'street'];
            if (kind && !allowedKinds.includes(kind)) {
              return null;
            }

            // Проверяем, что результат относится к выбранному городу
            const fullAddress = `${description || ''} ${
              name || ''
            }`.toLowerCase();
            const cityNameLower = cityName.toLowerCase();

            // Если адрес не содержит название города, пропускаем
            if (!fullAddress.includes(cityNameLower)) {
              return null;
            }

            // Убираем название города из подсказки, оставляем только адрес
            let displayText = name;
            if (description && description.includes(cityName)) {
              displayText = name;
            }

            // Возвращаем объект с текстом и координатами
            if (lat !== null && lng !== null) {
              return {
                text: displayText,
                lat,
                lng,
              };
            }

            return null;
          })
          .filter((suggestion: any) => suggestion !== null)
          .slice(0, 5);

        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(suggestions.length > 0);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error('❌ Failed to load address suggestions:', error);
      setAddressSuggestions([]);
    }
  };

  // Обработка изменения центра карты (пин по центру)
  // Получение адреса по координатам для попапа
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
      if (!apiKey) return 'Адрес не найден';

      const url = `https://geocode-maps.yandex.ru/1.x?apikey=${apiKey}&format=json&geocode=${lng},${lat}&kind=house&results=1&lang=ru_RU`;

      const response = await fetch(url);
      const data = await response.json();

      const members = data.response?.GeoObjectCollection?.featureMember;
      if (members && members.length > 0) {
        const geoObject = members[0].GeoObject;
        const description = geoObject.description;
        const name = geoObject.name;

        // Формируем адрес
        let address = name;
        if (description && !description.includes(cityName)) {
          address = `${description}, ${name}`;
        }

        return address;
      }
    } catch (error) {
      console.warn('Не удалось получить адрес по координатам:', error);
    }
    return 'Адрес не найден';
  };

  // Показать попап выбора адреса
  const showAddressConfirm = async (newLat: number, newLng: number) => {
    const address = await getAddressFromCoords(newLat, newLng);

    // Определяем город по координатам
    let cityData = null;
    try {
      const nearest = await findNearestCity(newLat, newLng);
      if (nearest && nearest.label) {
        cityData = {
          cityLabel: nearest.label,
          cityName: nearest.namecase?.nominative ?? nearest.name,
          cityNamePreposition:
            nearest.namecase?.prepositional ??
            nearest.namecase?.nominative ??
            nearest.name,
        };
      }
    } catch (e) {
      console.warn('Не удалось определить город:', e);
    }

    setPendingAddressData({
      address,
      lat: newLat,
      lng: newLng,
      ...cityData,
    });
    setShowAddressConfirmPopup(true);
  };

  // Подтвердить выбор адреса
  const confirmAddressSelection = () => {
    if (!pendingAddressData) return;

    // Обновляем адрес
    const finalAddress =
      pendingAddressData.address === 'Адрес не найден'
        ? 'Без адреса'
        : pendingAddressData.address;
    setAddress(finalAddress);

    // Обновляем город если он отличается
    if (
      pendingAddressData.cityLabel &&
      pendingAddressData.cityLabel !== cityLabel
    ) {
      setCityLabel(pendingAddressData.cityLabel);
      setCityName(pendingAddressData.cityName || null);
      setCityNamePreposition(pendingAddressData.cityNamePreposition || null);
    }

    // Обновляем координаты
    setLat(pendingAddressData.lat);
    setLng(pendingAddressData.lng);

    // Закрываем попап и возвращаем оверлей
    setShowAddressConfirmPopup(false);
    setPendingAddressData(null);
    setIsMapOverlayVisible(true);
  };

  const handleMapCenterChange = (newLat: number, newLng: number) => {
    // Просто обновляем координаты без показа попапа
    setLat(newLat);
    setLng(newLng);
  };

  // Обработчик клика по пину для выбора адреса
  const handlePinClick = () => {
    if (!isMapOverlayVisible && lat && lng) {
      showAddressConfirm(lat, lng);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-3">
      <h2 className="text-base sm:text-lg font-semibold">Локация</h2>

      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">
          Город
        </label>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm sm:text-base text-gray-800">
            {cityName || 'Не выбран'}
          </div>
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors font-medium"
          >
            Выбрать город
          </button>
        </div>
      </div>

      <div className="relative">
        <label className="block text-xs sm:text-sm font-medium mb-1">
          Адрес (улица, дом)
        </label>
        <input
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          onFocus={() =>
            addressSuggestions.length > 0 && setShowAddressSuggestions(true)
          }
          onBlur={() => {
            // Задержка чтобы пользователь успел кликнуть на подсказку
            setTimeout(() => setShowAddressSuggestions(false), 200);
          }}
          placeholder="Например, ул. Ленина, д. 10"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base"
        />

        {/* Подсказки адресов */}
        {showAddressSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {addressSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAddressSuggestionSelect(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <span className="text-sm sm:text-base text-gray-900">
                  {suggestion.text}
                </span>
              </button>
            ))}
          </div>
        )}
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
                state={{ center: [lat, lng], zoom: zoom }}
                width="100%"
                height="100%"
                options={{
                  suppressMapOpenBlock: true,
                  minZoom: 3,
                  maxZoom: 18,
                }}
                onBoundsChange={(e: any) => {
                  const target = e.get('target');
                  const center = target.getCenter();
                  const currentZoom = target.getZoom();

                  if (center && center.length === 2) {
                    handleMapCenterChange(center[0], center[1]);
                    setZoom(currentZoom);
                  }
                }}
              />
              {/* Пин по центру */}
              <button
                onClick={handlePinClick}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full focus:outline-none focus:ring-2 focus:ring-violet-300 rounded-full z-1"
                disabled={isMapOverlayVisible}
              >
                <div className="w-6 h-6 bg-violet-500 rounded-full border-2 border-white shadow-lg hover:bg-violet-600 transition-colors" />
                <div className="w-0.5 h-4 bg-violet-500 mx-auto hover:bg-violet-600 transition-colors" />
              </button>
            </div>
          </YMaps>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm sm:text-base text-gray-400">
            Загрузка карты...
          </div>
        )}

        {/* Оверлей с кнопкой "Показать на карте" */}
        {isMapOverlayVisible && (
          <div className="absolute inset-0 bg-white/50 flex items-end justify-center pb-6 z-2">
            <button
              onClick={() => setIsMapOverlayVisible(false)}
              className="px-5 py-3 text-xs sm:text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium shadow-lg"
            >
              Указать на карте
            </button>
          </div>
        )}

        {/* Подсказка для выбора адреса */}
        {!isMapOverlayVisible && !showAddressConfirmPopup && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-black/70 text-white text-xs sm:text-sm px-3 py-2 rounded-lg text-center">
              Переместите карту и нажмите на пин, чтобы выбрать адрес
            </div>
          </div>
        )}
      </div>

      {/* Попап подтверждения адреса над картой */}
      {showAddressConfirmPopup && pendingAddressData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg p-4 shadow-xl border border-gray-200 min-w-80 relative pointer-events-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {pendingAddressData.address === 'Адрес не найден'
                ? 'Сохранить место?'
                : 'Выбрать этот адрес?'}
            </h3>
            <div className="text-xs sm:text-sm text-gray-600 mb-3">
              <strong>Адрес:</strong>{' '}
              {pendingAddressData.address === 'Адрес не найден'
                ? 'Без адреса'
                : pendingAddressData.address}
            </div>
            {pendingAddressData.cityName &&
              pendingAddressData.cityName !== cityName && (
                <div className="text-xs sm:text-sm text-amber-600 mb-3">
                  <strong>Город изменится на:</strong>{' '}
                  {pendingAddressData.cityName}
                </div>
              )}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddressConfirmPopup(false);
                  setPendingAddressData(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
              >
                Отмена
              </button>
              <button
                onClick={confirmAddressSelection}
                className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors text-xs sm:text-sm"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора города */}
      {showLocationModal && (
        <CitySelectorModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelect={handleCitySelect}
          currentCity={cityName}
        />
      )}
    </section>
  );
}
