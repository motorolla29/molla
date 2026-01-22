'use client';

import { useEffect, useState } from 'react';
import { getSocket, getConnectionStatus, SocketConnectionStatus } from '@/lib/chat-socket';
import { useUnreadMessagesStore } from '@/store/useUnreadMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function GlobalMessageListener() {
  const { user } = useAuthStore();
  const [socket] = useState(() => getSocket());
  const [status, setStatus] = useState<SocketConnectionStatus>(
    getConnectionStatus().status
  );

  const { setChatUnreadCount } = useUnreadMessagesStore();

  useEffect(() => {
    if (!socket || !user) return;

    // Обработка обновлений счетчика непрочитанных сообщений
    const handleUnreadUpdate = ({ chatId, unreadCount }: { chatId: string; unreadCount: number }) => {
      console.log('GlobalMessageListener: Unread update received:', { chatId, unreadCount });
      setChatUnreadCount(chatId, unreadCount);
    };

    // Слушаем события
    socket.on('unread_update', handleUnreadUpdate);

    return () => {
      socket.off('unread_update', handleUnreadUpdate);
    };
  }, [socket, user, setChatUnreadCount]);

  return null;
}