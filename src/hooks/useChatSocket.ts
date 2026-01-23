'use client';

import { useEffect, useState } from 'react';
import {
  getConnectionStatus,
  getSocket,
  useSocketConnection,
  SocketConnectionStatus,
} from '@/lib/chat-socket';
import { useChatPresenceStore } from '@/store/useChatPresenceStore';

export function useChatSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketConnectionStatus>(
    getConnectionStatus().status
  );

  const { setOnline, setOffline, setSnapshot } = useChatPresenceStore();

  useEffect(() => {
    // Инициализируем сокет асинхронно
    getSocket().then(setSocket).catch((error) => {
      console.error('Failed to get socket:', error);
    });
  }, []);

  useEffect(() => {
    const off = useSocketConnection((state) => {
      setStatus(state);
    });
    return off;
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSnapshot = (payload: { onlineUserIds: number[] }) => {
      console.log('Presence snapshot received:', payload.onlineUserIds);
      setSnapshot(payload.onlineUserIds || []);
    };

    const handleOnline = ({ userId }: { userId: number }) => {
      console.log('User online:', userId);
      setOnline(userId);
    };

    const handleOffline = ({
      userId,
      lastSeenAt,
    }: {
      userId: number;
      lastSeenAt?: string;
    }) => {
      console.log('User offline:', userId, lastSeenAt);
      setOffline(userId, lastSeenAt);
    };

    socket.on('presence_snapshot', handleSnapshot);
    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    return () => {
      socket.off('presence_snapshot', handleSnapshot);
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
    };
  }, [socket]);

  return { socket, status };
}
