import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  rating: number;
  city: string | null;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (
    updates: Partial<User> & { verificationCode?: string }
  ) => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      token: null,
      login: (user, token) => {
        set({ isLoggedIn: true, user, token });
        // Переносим локальные избранные в базу данных и загружаем актуальные данные
        import('./useFavoritesStore').then(async ({ useFavoritesStore }) => {
          await useFavoritesStore.getState().migrateFromLocalStorage();
        });
      },
      logout: () => {
        // Очищаем localStorage при выходе
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
        set({ isLoggedIn: false, user: null, token: null });
      },
      setUser: (user) => set((state) => ({ ...state, user })),
      updateUser: async (updates) => {
        const { token } = get();
        if (!token) {
          throw new Error('Не авторизован');
        }

        const response = await fetch('/api/auth/update-user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка обновления данных');
        }

        // Обновляем пользователя в store
        set((state) => ({
          ...state,
          user: data.user,
        }));
      },
      initialize: () => {
        // Проверяем токен при инициализации
        const { token } = get();
        if (token) {
          // Здесь можно добавить проверку валидности токена через API
          // Пока просто проверяем наличие токена
          set({ isLoggedIn: true });
          // Загружаем избранное при инициализации
          import('./useFavoritesStore').then(({ useFavoritesStore }) => {
            useFavoritesStore.getState().loadFavorites();
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Сохраняем только эти поля
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
