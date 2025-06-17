'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';

export default function LocationInitializer() {
  const { city, lat, lon, setLocation } = useLocationStore();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (tried) return;
    setTried(true);

    // Сначала проверяем localStorage через store:
    if (city && lat != null && lon != null) return;
    try {
      const json = localStorage.getItem('userLocation');
      if (json) {
        const obj = JSON.parse(json);
        if (
          obj.city &&
          typeof obj.lat === 'number' &&
          typeof obj.lon === 'number'
        ) {
          setLocation(obj.city, obj.lat, obj.lon);
          return;
        }
      }
    } catch {}

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          try {
            const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
            if (!apiKey) return;
            const url = `https://geocode-maps.yandex.ru/1.x?apikey=${apiKey}&format=json&geocode=${longitude},${latitude}&kind=locality&results=1`;
            const res = await fetch(url);
            if (!res.ok) {
              console.warn('Reverse geocode failed:', res.status);
              return;
            }
            const data = await res.json();
            const members = data.response?.GeoObjectCollection?.featureMember;
            if (members && members.length) {
              const geoObj = members[0].GeoObject;
              let cityName: string | null = null;
              try {
                const details =
                  geoObj.metaDataProperty.GeocoderMetaData.Address.Details;
                const country = details?.Country;
                const adminArea = country?.AdministrativeArea;
                const locality = adminArea?.Locality;
                if (locality?.LocalityName) {
                  cityName = locality.LocalityName;
                }
              } catch {}
              if (!cityName) {
                cityName = geoObj.name || null;
              }
              if (cityName) {
                setLocation(cityName, latitude, longitude);
              }
            }
          } catch (e) {
            console.error('Ошибка геокодирования Яндекс:', e);
          }
        },
        (err) => {
          console.warn('Геолокация отклонена или недоступна', err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [tried, setLocation]);

  return null;
}
