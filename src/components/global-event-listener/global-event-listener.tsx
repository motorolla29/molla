'use client';

import { useEffect, useState } from 'react';
import {
  getSocket,
  getConnectionStatus,
  SocketConnectionStatus,
} from '@/lib/chat-socket';
import { Socket } from 'socket.io-client';
import { useUnreadMessagesStore } from '@/store/useUnreadMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatPresenceStore } from '@/store/useChatPresenceStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

export default function GlobalEventListener() {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketConnectionStatus>(
    getConnectionStatus().status
  );

  const { setChatUnreadCount, refreshUnreadCounts } = useUnreadMessagesStore();
  const { setSnapshot, setOnline, setOffline } = useChatPresenceStore();
  const setNotificationsUnreadCount = useNotificationsStore(
    (state) => state.setUnreadCount
  );
  const initializeNotifications = useNotificationsStore(
    (state) => state.initialize
  );

  useEffect(() => {
    // Инициализируем сокет асинхронно
    getSocket()
      .then(setSocket)
      .catch((error) => {
        console.error('Failed to get socket:', error);
      });

    // Инициализируем счетчик уведомлений при запуске приложения
    initializeNotifications();
  }, [initializeNotifications]);

  // Начальная инициализация счетчиков непрочитанных при загрузке приложения / смене пользователя
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const res = await fetch('/api/messenger/chats');
        if (!res.ok) {
          return;
        }
        const { chats } = await res.json();
        // Ожидаем, что API вернет объекты с { id, unreadCount }
        refreshUnreadCounts(chats);
      } catch (error) {
        // Игнорируем network errors при перезагрузке страницы
        if (!(error instanceof TypeError && error.message.includes('fetch'))) {
          console.error('Failed to load initial unread counts:', error);
        }
      }
    })();
  }, [user, refreshUnreadCounts]);

  useEffect(() => {
    if (!socket || !user) return;

    // Обработка обновлений счетчика непрочитанных сообщений
    const handleUnreadUpdate = ({
      chatId,
      unreadCount,
    }: {
      chatId: string;
      unreadCount: number;
    }) => {
      setChatUnreadCount(chatId, unreadCount);
    };

    // Обработка presence (онлайн-статусы собеседников)
    const handlePresenceSnapshot = ({
      onlineUserIds,
    }: {
      onlineUserIds: number[];
    }) => {
      setSnapshot(onlineUserIds || []);
    };

    const handleUserOnline = ({ userId }: { userId: number }) => {
      setOnline(userId);
    };

    const handleUserOffline = ({
      userId,
      lastSeenAt,
    }: {
      userId: number;
      lastSeenAt?: string;
    }) => {
      setOffline(userId, lastSeenAt);
    };

    // Обработка уведомлений
    const handleNotificationCreated = (data: any) => {
      // Делаем запрос на получение актуального количества за последние 30 дней
      fetch('/api/notifications?unreadOnly=true&last30days=true')
        .then((res) => res.json())
        .then(({ unreadCount }) => {
          setNotificationsUnreadCount(unreadCount);
        })
        .catch((error) => {
          console.error('Failed to fetch unread count:', error);
        });
    };

    // Слушаем события
    socket.on('unread_update', handleUnreadUpdate);
    socket.on('presence_snapshot', handlePresenceSnapshot);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('notification-created', handleNotificationCreated);

    return () => {
      socket.off('unread_update', handleUnreadUpdate);
      socket.off('presence_snapshot', handlePresenceSnapshot);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('notification-created', handleNotificationCreated);
    };
  }, [socket, user, setChatUnreadCount, setNotificationsUnreadCount]);

  return null;
}
