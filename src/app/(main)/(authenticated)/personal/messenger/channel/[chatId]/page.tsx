'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { lockScrollSimple, unlockScrollSimple } from '@/utils/scroll-lock';
import ChatArea from '@/components/messenger/chat-area';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatPresenceStore } from '@/store/useChatPresenceStore';
import { useUnreadMessagesStore } from '@/store/useUnreadMessagesStore';
import ImageModal from '@/components/messenger/image-modal';

interface Chat {
  id: string;
  adId: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  adCity: string;
  adCityLabel: string;
  adCategory: string;
  isAdDeleted?: boolean;
  otherUserId: number | null;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserLastSeenAt?: string | null;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
  isBlockedByMe?: boolean;
  isBlockedMe?: boolean;
}

interface Message {
  id: string;
  stableId: string;
  chatId?: string;
  content: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date | string;
  type: 'text' | 'image';
  attachments?: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    blobUrl: string;
  }>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useParams<{ chatId: string }>();
  const chatId = (params?.chatId as string) || '';
  const { socket } = useChatSocket();
  const onlineUserIds = useChatPresenceStore((state) => state.onlineUserIds);
  const lastSeenMap = useChatPresenceStore((state) => state.lastSeen);
  const updateLastSeen = useChatPresenceStore((state) => state.updateLastSeen);
  const typingMap = useChatPresenceStore((state) => state.typing);
  const markTyping = useChatPresenceStore((state) => state.markTyping);
  const clearTyping = useChatPresenceStore((state) => state.clearTyping);

  // Канал мессенджера в офлайне сразу отправляем на /offline,
  // чтобы не было ERR_FAILED / падений при загрузке сообщений.
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.onLine) {
      try {
        sessionStorage.setItem('offline:last-url', window.location.href);
      } catch {}
      router.replace('/offline');
    }
  }, [router]);

  // Блокировка скролла и прокрутка вверх при заходе на страницу (только для мобильных)
  useEffect(() => {
    // Проверяем ширину экрана - блокируем скролл только для экранов менее 640px
    const isMobile = window.innerWidth < 1024;
    setIsScrollLocked(isMobile);

    if (isMobile) {
      lockScrollSimple();
    }
    window.scrollTo(0, 0);

    return () => {
      if (isMobile) {
        unlockScrollSimple();
      }
    };
  }, []);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Ref для управления таймером typing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Обработчики для модального окна изображений
  const openImageModal = useCallback((imageUrl: string, altText: string) => {
    setSelectedImage({ url: imageUrl, alt: altText });
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Загрузка информации о чате
  useEffect(() => {
    if (user && chatId) {
      loadChatInfo();
      loadMessages();
      markMessagesAsRead();
    }
  }, [user, chatId]);

  // Автоматическая отметка сообщений как прочитанные при входе в чат
  const markMessagesAsRead = async () => {
    try {
      const response = await fetch(`/api/messenger/chats/${chatId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        // Обновляем глобальный store с непрочитанными сообщениями
        const { markChatAsRead } = useUnreadMessagesStore.getState();
        markChatAsRead(chatId);
      }
    } catch (error) {
      // Игнорируем network errors при навигации
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const loadChatInfo = async () => {
    try {
      // Получаем информацию о конкретном чате
      const response = await fetch(`/api/messenger/chats/${chatId}`);
      if (response.ok) {
        const chatData = await response.json();
        setChat(chatData);
        if (chatData.otherUserLastSeenAt && chatData.otherUserId != null) {
          updateLastSeen(chatData.otherUserId, chatData.otherUserLastSeenAt);
        }
      } else if (response.status === 404) {
        setError('Чат не найден');
      } else {
        setError('Ошибка загрузки чата');
      }
    } catch (error) {
      // Игнорируем network errors (TypeError при fetch) - они нормальны при навигации
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.debug('Chat loading cancelled during navigation');
        return;
      }
      console.error('Error loading chat info:', error);
      setError('Ошибка загрузки чата');
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/messenger/chats/${chatId}/messages?limit=50`,
      );
      if (response.ok) {
        const data: { messages: Message[]; hasMore: boolean } =
          await response.json();
        setMessages(data.messages);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      // Игнорируем network errors при навигации
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
        console.error('Error loading messages:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    try {
      setIsLoadingMore(true);
      const oldestMessageId = messages[0]?.id;
      const response = await fetch(
        `/api/messenger/chats/${chatId}/messages?limit=50&beforeId=${encodeURIComponent(
          oldestMessageId,
        )}`,
      );

      if (response.ok) {
        const data: { messages: Message[]; hasMore: boolean } =
          await response.json();

        // Добавляем более старые сообщения в начало списка
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Подключение к сокету и обработка событий
  useEffect(() => {
    if (!socket || !chatId || !user || !chat) return;

    socket.emit('join_chat', { chatId });

    const handleNewMessage = async (payload: any) => {
      if (payload.chatId !== chatId) return;

      const isFromOtherUser = payload.senderId !== Number(user.id);

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === payload.id);
        if (exists) return prev;

        // Для отправителя может быть temp сообщение, которое нужно обновить
        const existingTempMessage = prev.find(
          (m) => m.senderId === Number(user.id) && m.status === 'sending',
        );
        if (
          existingTempMessage &&
          existingTempMessage.senderId === payload.senderId
        ) {
          // Сохраняем blobUrl из локального сообщения
          const updatedAttachments = payload.attachments?.map(
            (attachment: any) => {
              const localAttachment = existingTempMessage.attachments?.find(
                (local) => local.fileName === attachment.fileName,
              );
              return {
                ...attachment,
                blobUrl: localAttachment?.blobUrl || '', // Сохраняем blobUrl из локального сообщения
              };
            },
          );

          return prev.map((m) =>
            m.id === existingTempMessage.id
              ? {
                  ...m,
                  id: payload.id,
                  content: payload.content,
                  timestamp: payload.timestamp || m.timestamp,
                  status: payload.status || 'sent',
                  attachments: updatedAttachments || m.attachments,
                }
              : m,
          );
        }

        // Новое сообщение от другого пользователя
        return [
          ...prev,
          {
            id: payload.id || payload.tempId || `socket-${Date.now()}`,
            stableId:
              payload.stableId || `stable-${Date.now()}-${Math.random()}`,
            content: payload.content,
            senderId: payload.senderId,
            senderName: '',
            timestamp: payload.timestamp || new Date(),
            type: payload.type === 'image' ? 'image' : 'text',
            status: isFromOtherUser ? 'read' : payload.status || 'sent', // Сообщения от других пользователей сразу отмечаются как прочитанные
            attachments: (payload.attachments || []).map((att: any) => ({
              ...att,
              blobUrl: att.blobUrl || '',
            })),
          },
        ];
      });

      // Если сообщение от другого пользователя, автоматически отмечаем его как прочитанное
      // (поскольку пользователь находится в чате и видит новые сообщения)
      if (isFromOtherUser) {
        try {
          // Сначала отмечаем как доставленное
          await fetch('/api/messenger/messages/delivered', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageIds: [payload.id],
            }),
          });

          // Автоматически отмечаем как прочитанное, поскольку пользователь в чате
          const readResponse = await fetch(
            `/api/messenger/chats/${chatId}/read`,
            {
              method: 'POST',
            },
          );

          if (readResponse.ok) {
            // Обновляем глобальный store с непрочитанными сообщениями
            const { markChatAsRead } = useUnreadMessagesStore.getState();
            markChatAsRead(chatId);
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    };

    const handleMessageSaved = ({
      tempId,
      message,
    }: {
      tempId?: string;
      message: any;
    }) => {
      if (message.chatId !== chatId) return;
      if (tempId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: message.id,
                  status: message.status || 'sent',
                  timestamp: message.timestamp || m.timestamp,
                  attachments: message.attachments
                    ? message.attachments.map(
                        (serverAtt: any, index: number) => {
                          const result = {
                            ...serverAtt,
                            // Сохраняем blobUrl из локального сообщения, если он есть
                            blobUrl:
                              m.attachments?.[index]?.blobUrl ||
                              serverAtt.blobUrl ||
                              '',
                          };
                          return result;
                        },
                      )
                    : m.attachments,
                }
              : m,
          ),
        );
      } else {
        handleNewMessage(message);
      }
    };

    const handleTyping = ({
      chatId: incomingChatId,
      fromUserId,
      at,
    }: {
      chatId: string;
      fromUserId: number;
      at: number;
    }) => {
      if (incomingChatId !== chatId || fromUserId === Number(user.id)) return;

      // Очищаем предыдущий таймер
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Устанавливаем typing состояние
      markTyping(chatId, fromUserId, at);

      // Запускаем новый таймер на 3 секунды
      typingTimeoutRef.current = setTimeout(() => {
        clearTyping(chatId, fromUserId);
        typingTimeoutRef.current = null;
      }, 3000);
    };

    const handleStopTyping = ({
      chatId: incomingChatId,
      fromUserId,
    }: {
      chatId: string;
      fromUserId: number;
    }) => {
      if (incomingChatId !== chatId || fromUserId === Number(user.id)) return;

      // Очищаем таймер и состояние
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      clearTyping(chatId, fromUserId);
    };

    const handleMessageStatusUpdate = ({
      chatId: incomingChatId,
      messageIds,
      status,
      updatedBy,
    }: {
      chatId: string;
      messageIds: string[];
      status: string;
      updatedBy: number;
    }) => {
      if (incomingChatId !== chatId) return;

      // Обновляем статус сообщений в локальном состоянии
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id)
            ? { ...msg, status: status as Message['status'] }
            : msg,
        ),
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_saved', handleMessageSaved);
    socket.on('message_status_update', handleMessageStatusUpdate);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.emit('leave_chat', { chatId });
      socket.off('new_message', handleNewMessage);
      socket.off('message_saved', handleMessageSaved);
      socket.off('message_status_update', handleMessageStatusUpdate);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, chatId, user, chat, markTyping]);

  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    tempMessageId?: string,
    localAttachments?: any[],
  ) => {
    if (!user) return;

    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('content', content);

    if (attachments) {
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    const response = await fetch('/api/messenger/messages', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const persisted: Message | null = data.message
        ? {
            id: data.message.id,
            stableId: `stable-${Date.now()}-${Math.random()}`,
            chatId: data.message.chatId,
            senderId: Number(user.id),
            senderName: user.name,
            content: data.message.content,
            timestamp: data.message.createdAt,
            type:
              data.message.messageType === 'image'
                ? 'image'
                : ('text' as const),
            status: 'delivered' as Message['status'],
            attachments: (data.message.attachments || []).map(
              (att: any, index: number) => ({
                id: att.id,
                fileUrl: att.fileUrl,
                fileName: att.fileName,
                fileType: att.fileType,
                // Сохраняем blobUrl из локального сообщения, если он есть
                blobUrl: localAttachments?.[index]?.blobUrl || '',
              }),
            ),
          }
        : null;

      if (persisted) {
        // Отправляем persisted сообщение через socket для доставки всем участникам
        socket?.emit('send_message', {
          chatId,
          persistedMessage: persisted,
        });
      }

      return {
        messageId: data.messageId,
        message: persisted
          ? {
              id: persisted.id,
              attachments: persisted.attachments?.map((att) => ({
                ...att,
                isLoading: false,
              })),
            }
          : undefined,
      };
    } else {
      // При ошибке кидаем исключение
      throw new Error('Failed to send message');
    }
  };

  const handleTyping = (() => {
    let lastSent = 0;
    return () => {
      const now = Date.now();
      if (now - lastSent > 500) {
        socket?.emit('typing', { chatId });
        lastSent = now;
      }
    };
  })();

  const handleStopTyping = () => {
    socket?.emit('stop_typing', { chatId });
  };

  const otherUserId: number | null = chat?.otherUserId ?? null;
  const isOtherUserOnline =
    otherUserId != null && onlineUserIds.has(otherUserId);

  // Используем lastSeen из presence store, если он есть, иначе из данных чата
  const otherUserLastSeen =
    otherUserId != null
      ? lastSeenMap[otherUserId] || chat?.otherUserLastSeenAt || null
      : chat?.otherUserLastSeenAt || null;

  const typingForChat =
    chatId && otherUserId != null ? typingMap[chatId]?.[otherUserId] : undefined;
  const isTyping =
    !!typingForChat && Date.now() - typingForChat < 3000;

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!user) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="my-10 text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Ошибка
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
        <Link
          href="/personal/messenger"
          className="inline-flex items-center px-4 py-2 bg-violet-500 text-white text-sm sm:text-base rounded-lg hover:bg-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-2" />
          Вернуться к чатам
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Область чата */}
      <ChatArea
        chat={chat}
        messages={messages}
        currentUserId={parseInt(user.id)}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        isOtherUserOnline={!!isOtherUserOnline}
        otherUserLastSeen={otherUserLastSeen}
        isTyping={isTyping}
        isLoading={isLoading || !chat}
        hasMoreMessages={hasMore}
        isLoadingMoreMessages={isLoadingMore}
        onLoadMoreMessages={loadMoreMessages}
        showBackButton={true}
        onImageModalOpen={openImageModal}
      />

      {/* Модальное окно для просмотра изображений */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeImageModal}
        imageUrl={selectedImage?.url || ''}
        altText={selectedImage?.alt || ''}
        scrollAlreadyLocked={isScrollLocked}
      />
    </div>
  );
}
