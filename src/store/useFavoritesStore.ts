// store/useFavoritesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdBase } from '@/types/ad';
import { useAuthStore } from './useAuthStore';
import { getOrCreateUserToken } from '@/utils';

interface FavoritesState {
  favorites: AdBase[];
  isLoading: boolean;
  error: string | null;
  favoriteIds: Set<string>; // Для быстрой проверки
  hasHydrated: boolean; // Флаг окончания гидрации persist
  loadFavorites: () => Promise<void>;
  addFavorite: (ad: AdBase, signal?: AbortSignal) => Promise<void>;
  removeFavorite: (
    adId: string,
    skipStateUpdate?: boolean,
    signal?: AbortSignal
  ) => Promise<void>;
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

      addFavorite: async (ad: AdBase, signal?: AbortSignal) => {
        const { favoriteIds, favorites } = get();

        set({ isLoading: true, error: null });

        try {
          const localUserToken = getOrCreateUserToken();

          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              adId: ad.id,
              localUserToken,
              createdAt: new Date().toISOString(),
            }),
            signal,
          });

          if (!response.ok) {
            let errorMessage = 'Не удалось добавить в избранное';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // Если не удалось прочитать JSON, используем статус код
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          // Проверяем, не был ли уже добавлен в избранное
          const isAlreadyFavorite = favoriteIds.has(ad.id);

          if (!isAlreadyFavorite) {
            const newFavoriteIds = new Set(favoriteIds);
            newFavoriteIds.add(ad.id);

            set({
              favorites: [ad, ...favorites],
              favoriteIds: newFavoriteIds,
              isLoading: false,
            });
          } else {
            // Уже в избранном, просто снимаем loading
            set({ isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Ошибка добавления',
            isLoading: false,
          });
          throw error;
        }
      },

      removeFavorite: async (
        adId: string,
        skipStateUpdate = false,
        signal?: AbortSignal
      ) => {
        const { isLoggedIn } = useAuthStore.getState();
        const { favoriteIds, favorites } = get();

        // Для авторизованных пользователей - синхронизация с API
        if (isLoggedIn) {
          set({ isLoading: true, error: null });

          try {
            const localUserToken = getOrCreateUserToken();

            const response = await fetch(
              `/api/favorites?adId=${adId}&localUserToken=${encodeURIComponent(
                localUserToken
              )}`,
              {
                method: 'DELETE',
                signal,
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Не удалось удалить из избранного'
              );
            }

            // Обновляем состояние только если не пропущено
            if (!skipStateUpdate) {
              // Проверяем, был ли уже удален из избранного
              const isCurrentlyFavorite = favoriteIds.has(adId);

              if (isCurrentlyFavorite) {
                const newFavoriteIds = new Set(favoriteIds);
                newFavoriteIds.delete(adId);

                set({
                  favorites: favorites.filter((ad) => ad.id !== adId),
                  favoriteIds: newFavoriteIds,
                  isLoading: false,
                });
              } else {
                // Уже удален, просто снимаем loading
                set({ isLoading: false });
              }
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
          // Получаем localUserToken для миграции существующих записей
          const localUserToken = getOrCreateUserToken();

          // Отправляем все локальные избранные в базу данных
          // Сохраняем порядок добавления через createdAt timestamps
          const baseTime = Date.now();
          const promises = favorites.map(async (ad, index) => {
            // Создаем timestamp: чем раньше добавлено объявление, тем раньше timestamp
            // (favorites[0] - самое старое, favorites[last] - самое новое)
            // Для сортировки DESC на сервере: favorites[last] должен иметь самый поздний timestamp
            const createdAt = new Date(baseTime - index);

            const response = await fetch('/api/favorites', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                adId: ad.id,
                localUserToken, // Передаем localUserToken для корректной миграции
                createdAt: createdAt.toISOString(), // Передаем дату создания для сохранения порядка
              }),
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
      // Сохраняем только локальные данные
      partialize: (state) => ({
        favorites: state.favorites,
        favoriteIds: Array.from(state.favoriteIds), // Set не сериализуется, конвертируем в массив
      }),
      // При восстановлении конвертируем массив обратно в Set
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favoriteIds)) {
          // Фильтруем только строковые значения для безопасности типов
          state.favoriteIds = new Set(
            state.favoriteIds.filter(
              (id): id is string => typeof id === 'string'
            )
          );
        }

        // Помечаем, что persist-гидрация завершена
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);
