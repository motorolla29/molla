import {
  DEFAULT_CITY,
  DEFAULT_LAT,
  DEFAULT_LON,
  DEFAULT_CITY_PREPOSITION,
  DEFAULT_CITY_LABEL,
} from '@/const';
import { create } from 'zustand';

interface LocationState {
  cityName: string | null;
  cityLabel: string | null;
  cityNamePreposition: string | null;
  lat: number | null;
  lon: number | null;
  setLocation: (
    cityLabel: string,
    cityName: string,
    cityNamePreposition: string,
    lat: number,
    lon: number
  ) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  cityName: DEFAULT_CITY,
  cityLabel: DEFAULT_CITY_LABEL,
  cityNamePreposition: DEFAULT_CITY_PREPOSITION,
  lat: DEFAULT_LAT,
  lon: DEFAULT_LON,
  setLocation: (cityLabel, cityName, cityNamePreposition, lat, lon) => {
    set({ cityLabel, cityName, cityNamePreposition, lat, lon });
    try {
      const toStore = { cityLabel, cityName, cityNamePreposition, lat, lon };
      localStorage.setItem('userLocation', JSON.stringify(toStore));
    } catch (e) {
      console.warn('Не удалось сохранить location в localStorage', e);
    }
  },
  clearLocation: () => {
    set({
      cityName: null,
      cityLabel: null,
      cityNamePreposition: null,
      lat: null,
      lon: null,
    });
    try {
      localStorage.removeItem('userLocation');
    } catch (e) {
      console.warn('Не удалось удалить location из localStorage', e);
    }
  },
  setAllCities: () => {
    // Лейбл для поиска по всей базе: 'Россия'
    // мета: cityLabel для поиска на бэке, cityName для отображения, а падеж для текста
    const cityLabel = 'russia'; // или другой идентификатор, ожидаемый бэком
    const cityName = 'Россия';
    const cityNamePreposition = 'России';
    const lat = null;
    const lon = null;
    set({ cityLabel, cityName, cityNamePreposition, lat, lon });
    try {
      localStorage.setItem(
        'userLocation',
        JSON.stringify({ cityLabel, cityName, cityNamePreposition, lat, lon })
      );
    } catch (e) {
      console.warn('Не удалось сохранить all cities в localStorage', e);
    }
  },
}));
