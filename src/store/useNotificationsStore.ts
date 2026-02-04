import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  isInitialized: boolean;
  setUnreadCount: (count: number) => void;
  increment: (delta?: number) => void;
  reset: () => void;
  initialize: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  isInitialized: false,
  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },
  increment: (delta = 1) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount + delta),
    })),
  reset: () => {
    set({ unreadCount: 0 });
  },

  // Инициализация счетчика при первом доступе к store
  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const response = await fetch(
        '/api/notifications?unreadOnly=true&last30days=true'
      );
      if (response.ok) {
        const { unreadCount } = await response.json();
        set({ unreadCount, isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to initialize notifications count:', error);
    }
  },
}));
