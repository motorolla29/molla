import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  rating: number;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      token: null,
      login: (user, token) => set({ isLoggedIn: true, user, token }),
      logout: () => {
        // Очищаем localStorage при выходе
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
        set({ isLoggedIn: false, user: null, token: null });
      },
      setUser: (user) => set((state) => ({ ...state, user })),
      initialize: () => {
        // Проверяем токен при инициализации
        const { token } = get();
        if (token) {
          // Здесь можно добавить проверку валидности токена через API
          // Пока просто проверяем наличие токена
          set({ isLoggedIn: true });
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
