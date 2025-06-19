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
  setLocation: (cityLabel, cityName, cityNamePreposition, lat, lon) =>
    set({ cityLabel, cityName, cityNamePreposition, lat, lon }),
  clearLocation: () =>
    set({
      cityName: null,
      cityLabel: null,
      cityNamePreposition: null,
      lat: null,
      lon: null,
    }),
}));
