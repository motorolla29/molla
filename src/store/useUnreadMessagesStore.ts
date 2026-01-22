'use client';

import { create } from 'zustand';

interface UnreadMessagesState {
  totalUnreadCount: number;
  chatUnreadCounts: Record<string, number>; // chatId -> count
  setTotalUnreadCount: (count: number) => void;
  setChatUnreadCount: (chatId: string, count: number) => void;
  updateChatUnreadCount: (chatId: string, change: number) => void;
  markChatAsRead: (chatId: string) => void;
  refreshUnreadCounts: (chats: Array<{ id: string; unreadCount: number }>) => void;
}

export const useUnreadMessagesStore = create<UnreadMessagesState>((set, get) => ({
  totalUnreadCount: 0,
  chatUnreadCounts: {},

  setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),

  setChatUnreadCount: (chatId, count) =>
    set((state) => {
      const newChatUnreadCounts = { ...state.chatUnreadCounts, [chatId]: count };
      const newTotalUnreadCount = Object.values(newChatUnreadCounts).reduce(
        (sum, chatCount) => sum + chatCount,
        0
      );
      return {
        chatUnreadCounts: newChatUnreadCounts,
        totalUnreadCount: newTotalUnreadCount,
      };
    }),

  updateChatUnreadCount: (chatId, change) =>
    set((state) => {
      const currentCount = state.chatUnreadCounts[chatId] || 0;
      const newCount = Math.max(0, currentCount + change);
      const newChatUnreadCounts = { ...state.chatUnreadCounts, [chatId]: newCount };
      const newTotalUnreadCount = Object.values(newChatUnreadCounts).reduce(
        (sum, chatCount) => sum + chatCount,
        0
      );
      return {
        chatUnreadCounts: newChatUnreadCounts,
        totalUnreadCount: newTotalUnreadCount,
      };
    }),

  markChatAsRead: (chatId) =>
    set((state) => {
      const newChatUnreadCounts = { ...state.chatUnreadCounts, [chatId]: 0 };
      const newTotalUnreadCount = Object.values(newChatUnreadCounts).reduce(
        (sum, chatCount) => sum + chatCount,
        0
      );
      return {
        chatUnreadCounts: newChatUnreadCounts,
        totalUnreadCount: newTotalUnreadCount,
      };
    }),

  refreshUnreadCounts: (chats) =>
    set(() => {
      const newChatUnreadCounts: Record<string, number> = {};
      let newTotalUnreadCount = 0;

      chats.forEach((chat) => {
        newChatUnreadCounts[chat.id] = chat.unreadCount;
        newTotalUnreadCount += chat.unreadCount;
      });

      return {
        chatUnreadCounts: newChatUnreadCounts,
        totalUnreadCount: newTotalUnreadCount,
      };
    }),
}));