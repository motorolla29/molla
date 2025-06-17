import { DEFAULT_CITY, DEFAULT_LAT, DEFAULT_LON } from '@/const';
import { create } from 'zustand';

interface LocationState {
  city: string | null;
  lat: number | null;
  lon: number | null;
  setLocation: (city: string, lat: number, lon: number) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  city: DEFAULT_CITY,
  lat: DEFAULT_LAT,
  lon: DEFAULT_LON,
  setLocation: (city, lat, lon) => set({ city, lat, lon }),
  clearLocation: () => set({ city: null, lat: null, lon: null }),
}));
