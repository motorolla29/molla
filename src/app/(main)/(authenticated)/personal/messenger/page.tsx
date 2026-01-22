'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import ChatList from '@/components/messenger/chat-list';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatPresenceStore } from '@/store/useChatPresenceStore';
import { useUnreadMessagesStore } from '@/store/useUnreadMessagesStore';

interface Chat {
  id: string;
  adId: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserLastSeenAt?: string | null;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
}

export default function MessengerPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useChatSocket();
  console.log('MessengerPage socket:', socket);

  // Ref для управления таймерами typing
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const updateLastSeen = useChatPresenceStore((state) => state.updateLastSeen);

  // Прокрутка вверх при заходе на страницу
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Загрузка списка чатов
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Присоединение ко всем чатам для получения typing событий
  useEffect(() => {
    if (!socket || !chats.length) return;

    console.log('MessengerPage joining all chats:', chats.map(c => c.id));
    chats.forEach(chat => {
      socket.emit('join_chat', { chatId: chat.id });
    });

    return () => {
      console.log('MessengerPage leaving all chats');
      chats.forEach(chat => {
        socket.emit('leave_chat', { chatId: chat.id });
      });
    };
  }, [socket, chats]);

  // Обработка typing событий для всех чатов в списке
  useEffect(() => {
    console.log('MessengerPage typing useEffect triggered, socket:', socket, 'connected:', socket?.connected);
    if (!socket) {
      console.log('MessengerPage typing useEffect early return: no socket');
      return;
    }

    // Лог при подключении socket
    socket.on('connect', () => {
      console.log('MessengerPage socket connected');
    });

    socket.on('disconnect', () => {
      console.log('MessengerPage socket disconnected');
    });

    const markTyping = useChatPresenceStore.getState().markTyping;
    const clearTyping = useChatPresenceStore.getState().clearTyping;

    const handleTyping = ({
      chatId,
      fromUserId,
      at,
    }: {
      chatId: string;
      fromUserId: number;
      at: number;
    }) => {
      console.log(`[TYPING] ChatList typing event: ${chatId}-${fromUserId}-${at}`);

      // Очищаем предыдущий таймер для этого пользователя в этом чате
      const timeoutKey = `${chatId}-${fromUserId}`;
      if (typingTimeoutsRef.current.has(timeoutKey)) {
        clearTimeout(typingTimeoutsRef.current.get(timeoutKey)!);
      }

      // Устанавливаем typing состояние
      markTyping(chatId, fromUserId, at);

      // Запускаем новый таймер на 3 секунды
      const timeout = setTimeout(() => {
        clearTyping(chatId, fromUserId);
        typingTimeoutsRef.current.delete(timeoutKey);
      }, 3000);

      typingTimeoutsRef.current.set(timeoutKey, timeout);
    };

    const handleStopTyping = ({
      chatId,
      fromUserId,
    }: {
      chatId: string;
      fromUserId: number;
    }) => {
      console.log(`[TYPING] ChatList stop_typing event: ${chatId}-${fromUserId}`);

      // Очищаем таймер
      const timeoutKey = `${chatId}-${fromUserId}`;
      if (typingTimeoutsRef.current.has(timeoutKey)) {
        clearTimeout(typingTimeoutsRef.current.get(timeoutKey)!);
        typingTimeoutsRef.current.delete(timeoutKey);
      }

      clearTyping(chatId, fromUserId);
    };

    const handleNewMessage = (payload: any) => {
      console.log('MessengerPage new message received:', payload);

      // Определяем отображаемый текст для lastMessage
      let displayMessage = payload.content || '';
      if (payload.attachments && payload.attachments.length > 0) {
        const hasImages = payload.attachments.some((att: any) => att.fileType?.startsWith('image/'));
        if (hasImages && !displayMessage.trim()) {
          // Показываем "📎 Фото" только если нет текста сообщения
          displayMessage = '📎 Фото';
        }
      }

      // Обновляем lastMessage для соответствующего чата
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === payload.chatId) {
          const isFromOtherUser = payload.senderId !== Number(user?.id);
          const newUnreadCount = isFromOtherUser ? chat.unreadCount + 1 : chat.unreadCount;

          return {
            ...chat,
            lastMessage: displayMessage,
            lastMessageTime: payload.timestamp || new Date(),
            lastMessageStatus: payload.status || 'sent',
            unreadCount: newUnreadCount
          };
        }
        return chat;
      }));
    };

    console.log('MessengerPage registering event handlers');
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('new_message', handleNewMessage);

    // Обработка обновлений непрочитанных сообщений
    const handleUnreadUpdate = ({ chatId, unreadCount }: { chatId: string; unreadCount: number }) => {
      console.log('MessengerPage unread_update:', { chatId, unreadCount });

      // Обновляем локальное состояние чатов
      setChats(prevChats => prevChats.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount } : chat
      ));

      // Обновляем глобальный store
      const { setChatUnreadCount } = useUnreadMessagesStore.getState();
      setChatUnreadCount(chatId, unreadCount);
    };

    socket.on('unread_update', handleUnreadUpdate);

    return () => {
      console.log('MessengerPage cleanup event handlers');
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('new_message', handleNewMessage);
      socket.off('unread_update', handleUnreadUpdate);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      typingTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      typingTimeoutsRef.current.clear();
    };
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messenger/chats');
      if (response.ok) {
        const data = await response.json();
        console.log('MessengerPage loaded chats:', data.length);

        // Обрабатываем lastMessage для сообщений с изображениями
        const processedData = data.map((chat: Chat) => {
          let displayMessage = chat.lastMessage;
          // Если API возвращает информацию о attachments, можно добавить проверку здесь
          // Пока оставляем как есть, предполагая что API уже возвращает правильный формат
          return {
            ...chat,
            lastMessage: displayMessage
          };
        });

        setChats(processedData);

        // Обновляем store с непрочитанными сообщениями
        const { refreshUnreadCounts } = useUnreadMessagesStore.getState();
        refreshUnreadCounts(processedData);

        processedData.forEach((chat: Chat) => {
          if (chat.otherUserLastSeenAt) {
            updateLastSeen(chat.otherUserId, chat.otherUserLastSeenAt);
          }
        });
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      // Отмечаем сообщения в чате как прочитанные через API
      const response = await fetch(`/api/messenger/chats/${chatId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        // Обновляем локальное состояние чатов
        setChats(prevChats => prevChats.map(chat =>
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        ));

        // Обновляем store с непрочитанными сообщениями
        const { markChatAsRead } = useUnreadMessagesStore.getState();
        markChatAsRead(chatId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }

    router.push(`/personal/messenger/channel/${chatId}`);
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  if (isLoading) {
    return (
      <div className="my-16 text-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка чатов...</p>
      </div>
    );
  }

  return (
    <div className="m-4 lg:m-6 h-full">
      {/* Заголовок */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Сообщения</h1>
      </div>

      {/* Список чатов */}
      <ChatList chats={chats} onChatSelect={handleChatSelect} />
    </div>
  );
}
