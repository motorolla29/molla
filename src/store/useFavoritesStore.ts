// store/useFavoritesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdBase } from '@/types/ad';
import { useAuthStore } from './useAuthStore';

interface FavoritesState {
  favorites: AdBase[];
  isLoading: boolean;
  error: string | null;
  favoriteIds: Set<string>; // Для быстрой проверки
  hasHydrated: boolean; // Флаг окончания гидрации persist
  loadFavorites: () => Promise<void>;
  addFavorite: (ad: AdBase) => Promise<void>;
  removeFavorite: (adId: string, skipStateUpdate?: boolean) => Promise<void>;
  isFavorite: (adId: string) => boolean;
  toggleFavorite: (ad: AdBase) => Promise<void>;
  clearError: () => void;
  migrateFromLocalStorage: () => Promise<void>; // Перенос из localStorage при авторизации
  clearLocalFavorites: () => void; // Очистка локального состояния
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,
      favoriteIds: new Set(),
      hasHydrated: false,

      loadFavorites: async () => {
        const { isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/favorites', {
            headers: {},
          });

          if (!response.ok) {
            throw new Error('Не удалось загрузить избранное');
          }

          const data = await response.json();
          const favorites: AdBase[] = data.favorites || [];
          const favoriteIds = new Set(favorites.map((ad) => ad.id));

          set({
            favorites,
            favoriteIds,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Ошибка загрузки',
            isLoading: false,
          });
        }
      },

      addFavorite: async (ad: AdBase) => {
        const { isLoggedIn } = useAuthStore.getState();
        const { favoriteIds, favorites } = get();

        // Для авторизованных пользователей - синхронизация с API
        if (isLoggedIn) {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch('/api/favorites', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ adId: ad.id }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Не удалось добавить в избранное'
              );
            }

            const newFavoriteIds = new Set(favoriteIds);
            newFavoriteIds.add(ad.id);

            set({
              // Для авторизованных также добавляем новое избранное в НАЧАЛО списка,
              // чтобы порядок на клиенте совпадал с orderBy createdAt DESC на сервере.
              favorites: [ad, ...favorites],
              favoriteIds: newFavoriteIds,
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error ? error.message : 'Ошибка добавления',
              isLoading: false,
            });
            throw error;
          }
        } else {
          // Для неавторизованных пользователей - только localStorage
          const newFavoriteIds = new Set(favoriteIds);
          newFavoriteIds.add(ad.id);

          set({
            favorites: [ad, ...favorites],
            favoriteIds: newFavoriteIds,
          });
        }
      },

      removeFavorite: async (adId: string, skipStateUpdate = false) => {
        const { isLoggedIn } = useAuthStore.getState();
        const { favoriteIds, favorites } = get();

        // Для авторизованных пользователей - синхронизация с API
        if (isLoggedIn) {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(`/api/favorites?adId=${adId}`, {
              method: 'DELETE',
              headers: {},
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Не удалось удалить из избранного'
              );
            }

            // Обновляем состояние только если не пропущено
            if (!skipStateUpdate) {
              const newFavoriteIds = new Set(favoriteIds);
              newFavoriteIds.delete(adId);

              set({
                favorites: favorites.filter((ad) => ad.id !== adId),
                favoriteIds: newFavoriteIds,
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Ошибка удаления',
              isLoading: false,
            });
            throw error;
          }
        } else {
          // Для неавторизованных пользователей - только localStorage
          const newFavoriteIds = new Set(favoriteIds);
          newFavoriteIds.delete(adId);

          set({
            favorites: favorites.filter((ad) => ad.id !== adId),
            favoriteIds: newFavoriteIds,
          });
        }
      },

      isFavorite: (adId: string) => {
        return get().favoriteIds.has(adId);
      },

      toggleFavorite: async (ad: AdBase) => {
        const { isFavorite, addFavorite, removeFavorite } = get();

        if (isFavorite(ad.id)) {
          await removeFavorite(ad.id);
        } else {
          await addFavorite(ad);
        }
      },

      migrateFromLocalStorage: async () => {
        const { isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn) return;

        const { favorites } = get();

        // Если локальных избранных нет, просто загружаем актуальные данные из базы
        if (favorites.length === 0) {
          await get().loadFavorites();
          return;
        }

        try {
          // Отправляем все локальные избранные в базу данных
          // ВАЖНО: отправляем в ОБРАТНОМ порядке, чтобы при сортировке по createdAt DESC
          // порядок на сервере совпал с текущим порядком favorites на клиенте.
          const promises = [...favorites].reverse().map(async (ad) => {
            const response = await fetch('/api/favorites', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ adId: ad.id }),
            });

            if (!response.ok) {
              console.warn(`Не удалось мигрировать объявление ${ad.id}`);
            }
          });

          await Promise.all(promises);

          // После успешной миграции загружаем актуальные данные из базы
          await get().loadFavorites();
        } catch (error) {
          console.error('Ошибка миграции избранного:', error);
        }
      },

      clearLocalFavorites: () => {
        set({
          favorites: [],
          favoriteIds: new Set(),
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'favorites-storage',
      // Сохраняем только ID избранных объявлений для надежности
      partialize: (state) => ({
        favoriteIds: Array.from(state.favoriteIds), // Set не сериализуется, конвертируем в массив
      }),
      // При восстановлении конвертируем массив обратно в Set и загружаем актуальные данные
      onRehydrateStorage: () => (state, error) => {
        if (state && Array.isArray(state.favoriteIds)) {
          // Фильтруем только строковые значения для безопасности типов
          state.favoriteIds = new Set(
            state.favoriteIds.filter(
              (id): id is string => typeof id === 'string'
            )
          );
        }

        // Очищаем локальные favorites при восстановлении (они загрузятся из API)
        if (state) {
          state.favorites = [];
          state.hasHydrated = true;

          // Загружаем актуальные данные из API после восстановления
          if (!error) {
            state.loadFavorites();
          }
        }
      },
    }
  )
);
