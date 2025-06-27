// store/useFavoritesStore.ts
import { create } from 'zustand';
import { AdBase } from '@/types/ad';
import { mockAds } from '@/data/mockAds';

interface FavoritesState {
  favorites: AdBase[];
  addFavorite: (ad: AdBase) => void;
  removeFavorite: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favorites: [],
  addFavorite: (ad) => set((s) => ({ favorites: [...s.favorites, ad] })),
  removeFavorite: (id) =>
    set((s) => ({
      favorites: s.favorites.filter((ad) => ad.id !== id),
    })),
}));
