import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  // … любые другие поля профиля
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: true,
  user: null,
  token: null,
  login: (user, token) => set({ isLoggedIn: true, user, token }),
  logout: () => set({ isLoggedIn: false, user: null, token: null }),
  setUser: (user) => set((state) => ({ ...state, user })),
}));
