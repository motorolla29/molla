'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import {
  DEFAULT_CITY,
  DEFAULT_CITY_LABEL,
  DEFAULT_CITY_PREPOSITION,
  DEFAULT_LAT,
  DEFAULT_LON,
} from '@/const';
import { findCityByNameExact, findNearestCity } from '@/utils';

export default function LocationInitializer() {
  const { cityLabel, cityName, cityNamePreposition, lat, lon, setLocation } =
    useLocationStore();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (tried) return;
    setTried(true);

    // 1) пробуем достать из localStorage:
    try {
      const json = localStorage.getItem('userLocation');
      if (json) {
        const obj = JSON.parse(json);
        // Поля: cityLabel, cityName, cityNamePreposition, lat, lon
        if (
          typeof obj.cityLabel === 'string' &&
          typeof obj.cityName === 'string' &&
          typeof obj.cityNamePreposition === 'string' &&
          // lat/lon могут быть null (для «Все города») или number
          (obj.lat === null || typeof obj.lat === 'number') &&
          (obj.lon === null || typeof obj.lon === 'number')
        ) {
          setLocation(
            obj.cityLabel,
            obj.cityName,
            obj.cityNamePreposition,
            obj.lat,
            obj.lon
          );
          return;
        }
      }
    } catch (e) {
      console.warn('Не удалось прочитать location из localStorage', e);
    }

    // Если нет сохранённой локации, сначала ставим дефолт из констант
    setLocation(
      DEFAULT_CITY_LABEL,
      DEFAULT_CITY,
      DEFAULT_CITY_PREPOSITION,
      DEFAULT_LAT,
      DEFAULT_LON
    );

    // 2) Затем пробуем геолокацию: после получения coords ищем ближайший город
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Попробуем reverse-geocode, но основная цель — получить название для точного поиска:
          let cityNameFound: string | null = null;
          try {
            const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
            if (apiKey) {
              const url = `https://geocode-maps.yandex.ru/1.x?apikey=${apiKey}&format=json&geocode=${longitude},${latitude}&kind=locality&results=1`;
              const res = await fetch(url);
              if (res.ok) {
                const data = await res.json();
                const members =
                  data.response?.GeoObjectCollection?.featureMember;
                if (members && members.length) {
                  const geoObj = members[0].GeoObject;
                  try {
                    const details =
                      geoObj.metaDataProperty.GeocoderMetaData.Address.Details;
                    const country = details?.Country;
                    const adminArea = country?.AdministrativeArea;
                    const locality = adminArea?.Locality;
                    if (locality?.LocalityName) {
                      cityNameFound = locality.LocalityName;
                    }
                  } catch {}
                  if (!cityNameFound) {
                    cityNameFound = geoObj.name || null;
                  }
                }
              } else {
                console.warn('Reverse geocode failed:', res.status);
              }
            }
          } catch (e) {
            console.warn('Ошибка геокодирования Яндекс (игнорируем имя):', e);
          }

          // Если получили имя от Яндекса, пробуем найти точное совпадение в JSON
          if (cityNameFound) {
            try {
              const matched = await findCityByNameExact(cityNameFound);
              if (matched) {
                const label = matched.label!;
                const nom = matched.namecase?.nominative ?? matched.name!;
                const prep = matched.namecase?.prepositional ?? nom;
                const latJson = matched.coords!.lat!;
                const lonJson = matched.coords!.lon!;
                setLocation(label, nom, prep, latJson, lonJson);
                try {
                  localStorage.setItem(
                    'userLocation',
                    JSON.stringify({
                      cityLabel,
                      cityName,
                      cityNamePreposition,
                      lat,
                      lon,
                    })
                  );
                } catch (e) {
                  console.warn(
                    'Не удалось сохранить location в localStorage',
                    e
                  );
                }
                return;
              } else {
                console.warn(
                  `Город "${cityNameFound}" не найден в JSON по имени, перейдём к nearest.`
                );
              }
            } catch (e) {
              console.error('Ошибка поиска по имени в JSON:', e);
            }
          }

          // Ищем ближайший город по чистым координатам
          try {
            const nearest = await findNearestCity(latitude, longitude);
            if (nearest && nearest.label && nearest.namecase) {
              const label = nearest.label;
              const nom = nearest.namecase.nominative ?? nearest.name!;
              const prep = nearest.namecase.prepositional ?? nom;
              const latJson = nearest.coords!.lat!;
              const lonJson = nearest.coords!.lon!;
              setLocation(label, nom, prep, latJson, lonJson);
              try {
                localStorage.setItem(
                  'userLocation',
                  JSON.stringify({
                    cityLabel,
                    cityName,
                    cityNamePreposition,
                    lat,
                    lon,
                  })
                );
              } catch (e) {
                console.warn('Не удалось сохранить location в localStorage', e);
              }
            } else {
              console.warn(
                'Не удалось найти nearest city в JSON по координатам, оставляю дефолтную локацию.'
              );
            }
          } catch (e) {
            console.error('Ошибка при поиске ближайшего города:', e);
          }
        },
        (err) => {
          console.warn('Геолокация отклонена или недоступна', err);
          // Если отказ, остаётся дефолт
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [tried, setLocation]);

  return null;
}
