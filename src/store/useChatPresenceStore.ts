'use client';

import { create } from 'zustand';

type TypingMap = Record<string, Record<number, number>>; // chatId -> userId -> timestamp

interface ChatPresenceState {
  onlineUserIds: Set<number>;
  lastSeen: Record<number, string>;
  typing: TypingMap;
  setOnline: (userId: number) => void;
  setOffline: (userId: number, lastSeenAt?: string | Date) => void;
  setSnapshot: (userIds: number[]) => void;
  updateLastSeen: (userId: number, lastSeenAt: string | Date) => void;
  markTyping: (chatId: string, userId: number, at: number) => void;
  clearTyping: (chatId: string, userId: number) => void;
}

export const useChatPresenceStore = create<ChatPresenceState>((set) => ({
  onlineUserIds: new Set<number>(),
  lastSeen: {},
  typing: {},
  setOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.add(userId);
      console.log('User set online:', userId, 'onlineUserIds now:', Array.from(next));
      return { ...state, onlineUserIds: next };
    }),
  setOffline: (userId, lastSeenAt) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(userId);
      const nextLastSeen = { ...state.lastSeen };
      if (lastSeenAt) {
        nextLastSeen[userId] =
          typeof lastSeenAt === 'string'
            ? lastSeenAt
            : lastSeenAt.toISOString();
      }
      return { ...state, onlineUserIds: next, lastSeen: nextLastSeen };
    }),
  setSnapshot: (userIds) =>
    set((state) => {
      const next = new Set<number>(userIds);
      console.log('Presence snapshot set:', userIds, 'onlineUserIds now:', Array.from(next));
      return { ...state, onlineUserIds: next };
    }),
  updateLastSeen: (userId, lastSeenAt) =>
    set((state) => ({
      ...state,
      lastSeen: {
        ...state.lastSeen,
        [userId]:
          typeof lastSeenAt === 'string'
            ? lastSeenAt
            : lastSeenAt.toISOString(),
      },
    })),
  markTyping: (chatId, userId, at) =>
    set((state) => {
      const typingForChat = state.typing[chatId] || {};
      return {
        ...state,
        typing: {
          ...state.typing,
          [chatId]: { ...typingForChat, [userId]: at },
        },
      };
    }),
  clearTyping: (chatId, userId) =>
    set((state) => {
      const typingForChat = state.typing[chatId];
      if (!typingForChat) return state;
      const { [userId]: _, ...rest } = typingForChat;
      return {
        ...state,
        typing: { ...state.typing, [chatId]: rest },
      };
    }),
}));
