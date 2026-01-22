'use client';

import { create } from 'zustand';

interface UserOnlineStatus {
  isOnline: boolean;
  lastSeenAt: string | null;
  lastChecked: Date;
}

interface OnlineUsersState {
  userStatuses: Record<number, UserOnlineStatus>;
  isLoading: boolean;
  fetchUsersStatuses: (userIds: number[]) => Promise<void>;
  getUserStatus: (userId: number) => UserOnlineStatus | null;
}

export const useOnlineUsersStore = create<OnlineUsersState>((set, get) => ({
  userStatuses: {},
  isLoading: false,

  fetchUsersStatuses: async (userIds: number[]) => {
    if (userIds.length === 0) return;

    try {
      set({ isLoading: true });

      const response = await fetch(`/api/users/online?userIds=${userIds.join(',')}`);
      if (response.ok) {
        const data = await response.json();

        set((state) => ({
          userStatuses: {
            ...state.userStatuses,
            ...data.statuses,
          },
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to fetch users statuses:', error);
      set({ isLoading: false });
    }
  },

  getUserStatus: (userId: number) => {
    return get().userStatuses[userId] || null;
  },
}));