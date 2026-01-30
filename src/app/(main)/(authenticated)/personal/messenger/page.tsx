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
  lastMessageStatus?: string | null;
  lastMessageIsOutgoing?: boolean;
  unreadCount: number;
}

export default function MessengerPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { socket } = useChatSocket();

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

    chats.forEach((chat) => {
      socket.emit('join_chat', { chatId: chat.id });
    });

    return () => {
      chats.forEach((chat) => {
        socket.emit('leave_chat', { chatId: chat.id });
      });
    };
  }, [socket, chats]);

  // Обработка typing событий для всех чатов в списке
  useEffect(() => {
    if (!socket) {
      return;
    }

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
      // Очищаем таймер
      const timeoutKey = `${chatId}-${fromUserId}`;
      if (typingTimeoutsRef.current.has(timeoutKey)) {
        clearTimeout(typingTimeoutsRef.current.get(timeoutKey)!);
        typingTimeoutsRef.current.delete(timeoutKey);
      }

      clearTyping(chatId, fromUserId);
    };

    const handleNewMessage = (payload: any) => {
      // Определяем отображаемый текст для lastMessage
      let displayMessage = payload.content || '';
      if (payload.attachments && payload.attachments.length > 0) {
        const hasImages = payload.attachments.some((att: any) =>
          att.fileType?.startsWith('image/'),
        );
        if (hasImages && !displayMessage.trim()) {
          // Показываем "📎 Фото" только если нет текста сообщения
          displayMessage = '📎 Фото';
        }
      }

      // Обновляем lastMessage для соответствующего чата и перемещаем его в начало списка
      setChats((prevChats) => {
        let updatedChats = prevChats.map((chat) => {
          if (chat.id === payload.chatId) {
            const isFromOtherUser = payload.senderId !== Number(user?.id);
            const newUnreadCount = isFromOtherUser
              ? chat.unreadCount + 1
              : chat.unreadCount;

            return {
              ...chat,
              lastMessage: displayMessage,
              lastMessageTime: payload.timestamp || new Date(),
              lastMessageStatus: payload.status || 'sent',
              lastMessageIsOutgoing: payload.senderId === Number(user?.id),
              unreadCount: newUnreadCount,
            };
          }
          return chat;
        });

        // Если чат не найден в списке, не добавляем его здесь
        // (это должен делать handleUnreadUpdate)

        // Сортируем по времени последнего сообщения (новые сверху)
        return updatedChats.sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime(),
        );
      });
    };

    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('new_message', handleNewMessage);

    // Обработка обновлений непрочитанных сообщений
    const handleUnreadUpdate = async ({
      chatId,
      unreadCount,
    }: {
      chatId: string;
      unreadCount: number;
    }) => {
      const existingChat = chats.find((chat) => chat.id === chatId);

      if (existingChat) {
        // Обновляем счетчик для существующего чата
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount } : chat,
          ),
        );
      } else {
        // Загружаем информацию о новом чате
        try {
          const response = await fetch(`/api/messenger/chats/${chatId}`);
          if (response.ok) {
            const newChatData = await response.json();

            // Используем актуальный счетчик из события unread_update вместо данных из API
            const chatWithCorrectUnreadCount = { ...newChatData, unreadCount };

            // Добавляем новый чат в начало списка или обновляем существующий
            setChats((prevChats) => {
              const existingChatIndex = prevChats.findIndex(
                (chat) => chat.id === chatId,
              );

              if (existingChatIndex >= 0) {
                // Чат уже есть, обновляем его счетчик
                const updatedChats = [...prevChats];
                updatedChats[existingChatIndex] = {
                  ...updatedChats[existingChatIndex],
                  unreadCount,
                };
                return updatedChats;
              } else {
                // Добавляем новый чат в начало списка
                return [chatWithCorrectUnreadCount, ...prevChats];
              }
            });

            // Обновляем информацию о последнем просмотре пользователя
            if (chatWithCorrectUnreadCount.otherUserLastSeenAt) {
              updateLastSeen(
                chatWithCorrectUnreadCount.otherUserId,
                chatWithCorrectUnreadCount.otherUserLastSeenAt,
              );
            }
          } else {
            console.error(
              'Failed to load new chat data:',
              response.status,
              await response.text(),
            );
          }
        } catch (error) {
          console.error('Error loading new chat info:', error);
        }
      }

      // Обновляем глобальный store
      const { setChatUnreadCount } = useUnreadMessagesStore.getState();
      setChatUnreadCount(chatId, unreadCount);
    };

    socket.on('unread_update', handleUnreadUpdate);

    // Обработка обновлений статуса сообщений (delivered или read)
    const handleMessageStatusUpdate = ({
      chatId,
      messageIds,
      status,
      updatedBy,
    }: {
      chatId: string;
      messageIds: string[];
      status: string;
      updatedBy: number;
    }) => {
      // Обновляем статус последнего сообщения в списке чатов
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            // Обновляем статус, если сообщение было отправлено текущим пользователем
            const isCurrentUserSender = chat.lastMessageIsOutgoing;
            if (
              isCurrentUserSender &&
              (status === 'delivered' || status === 'read')
            ) {
              return {
                ...chat,
                lastMessageStatus: status,
              };
            }
          }
          return chat;
        }),
      );
    };

    socket.on('message_status_update', handleMessageStatusUpdate);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('new_message', handleNewMessage);
      socket.off('unread_update', handleUnreadUpdate);
      socket.off('message_status_update', handleMessageStatusUpdate);
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

  const loadChats = async (limit = 20, beforeId?: string) => {
    try {
      if (!beforeId) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      if (beforeId) {
        params.set('beforeId', beforeId);
      }

      const response = await fetch(`/api/messenger/chats?${params}`);
      if (response.ok) {
        const data: { chats: Chat[]; hasMore: boolean } = await response.json();

        // Обрабатываем lastMessage для сообщений с изображениями
        const processedData = data.chats.map((chat: Chat) => {
          let displayMessage = chat.lastMessage;
          // Если API возвращает информацию о attachments, можно добавить проверку здесь
          // Пока оставляем как есть, предполагая что API уже возвращает правильный формат
          return {
            ...chat,
            lastMessage: displayMessage,
          };
        });

        // Сортируем по времени последнего сообщения (новые сверху), как в handleNewMessage
        const sortedData = processedData.sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime(),
        );

        if (beforeId) {
          // Добавляем к существующим чатам
          setChats((prev) => [...prev, ...sortedData]);
        } else {
          // Заменяем чаты
          setChats(sortedData);
        }

        setHasMore(data.hasMore);

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
      if (!beforeId) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const loadMoreChats = async () => {
    if (chats.length === 0) return;
    const lastChatId = chats[chats.length - 1].id;
    await loadChats(20, lastChatId);
  };

  const handleChatSelect = (chatId: string) => {
    // Оптимистичное обновление UI - сразу показываем что сообщения прочитаны
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );

    // Обновляем store с непрочитанными сообщениями
    const { markChatAsRead } = useUnreadMessagesStore.getState();
    markChatAsRead(chatId);

    // Мгновенный переход в чат
    router.push(`/personal/messenger/channel/${chatId}`);

    // Параллельно синхронизируем с сервером (без блокировки UI)
    fetch(`/api/messenger/chats/${chatId}/read`, {
      method: 'POST',
    }).catch((error) => {
      console.error('Error marking messages as read:', error);
      // В случае ошибки можно откатить оптимистичное обновление
      // Но для простоты оставим как есть
    });
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="m-4 lg:m-6 h-full">
      <div className="mb-2 min-[500px]:mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Сообщения</h1>
      </div>

      {isLoading ? (
        <div className="my-16 text-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка чатов...</p>
        </div>
      ) : (
        <ChatList
          chats={chats}
          onChatSelect={handleChatSelect}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMoreChats={loadMoreChats}
        />
      )}
    </div>
  );
}
