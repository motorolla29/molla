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
  isAuthChecking: boolean; // Новое состояние для отслеживания проверки авторизации
  login: (user: User, token: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (
    updates: Partial<User> & { verificationCode?: string }
  ) => Promise<void>;
  initialize: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      isAuthChecking: true, // Начинаем с true, чтобы показать loading
      login: async (user) => {
        set({ isLoggedIn: true, user });

        // Токен уже установлен в cookies сервером через API
        // Переносим локальные избранные в базу данных и загружаем актуальные данные
        const { useFavoritesStore } = await import('./useFavoritesStore');
        await useFavoritesStore.getState().migrateFromLocalStorage();
      },

      checkAuth: async () => {
        console.log('🔐 AuthStore.checkAuth: Начинаю запрос к /api/auth/check');
        set({ isAuthChecking: true });
        try {
          const response = await fetch('/api/auth/check');
          console.log('🔐 AuthStore.checkAuth: Ответ получен, status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('🔐 AuthStore.checkAuth: Авторизован, пользователь:', data.user?.name);
            set({ isLoggedIn: true, user: data.user, isAuthChecking: false });
          } else {
            console.log('🔐 AuthStore.checkAuth: Не авторизован, status:', response.status);
            set({ isLoggedIn: false, user: null, isAuthChecking: false });
          }
        } catch (error) {
          console.log('🔐 AuthStore.checkAuth: Ошибка сети:', error);
          set({ isLoggedIn: false, user: null, isAuthChecking: false });
        }
      },
      logout: async () => {
        // Очищаем cookies
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('Ошибка при выходе:', error);
        }

        // Очищаем localStorage при выходе
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('favorites-storage');
        }

        // Очищаем состояние избранного
        import('./useFavoritesStore').then(({ useFavoritesStore }) => {
          useFavoritesStore.getState().clearLocalFavorites();
        });

        set({ isLoggedIn: false, user: null });
      },
      setUser: (user) => set((state) => ({ ...state, user })),
      updateUser: async (updates) => {
        // Токен берем из cookies на сервере
        const response = await fetch('/api/auth/update-user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
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
      initialize: async () => {
        console.log('🔐 AuthStore.initialize: Начинаю проверку авторизации');
        // Проверяем авторизацию через API
        await get().checkAuth();
        console.log('🔐 AuthStore.initialize: checkAuth завершен, isLoggedIn:', get().isLoggedIn);

        // Если авторизован, загружаем избранное
        if (get().isLoggedIn) {
          console.log('🔐 AuthStore.initialize: Загружаю избранное');
          import('./useFavoritesStore').then(({ useFavoritesStore }) => {
            useFavoritesStore.getState().loadFavorites();
          });
        } else {
          console.log('🔐 AuthStore.initialize: Пользователь не авторизован');
        }
      },
    }),
    {
      name: 'auth-storage',
      // Сохраняем только user, токен в httpOnly cookies
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
