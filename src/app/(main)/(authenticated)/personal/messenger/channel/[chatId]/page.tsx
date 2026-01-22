'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { lockScrollSimple, unlockScrollSimple } from '@/utils/scroll-lock';
import ChatArea from '@/components/messenger/chat-area';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatPresenceStore } from '@/store/useChatPresenceStore';

interface Chat {
  id: string;
  adId: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  adCity: string;
  adCityLabel: string;
  adCategory: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserLastSeenAt?: string | null;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
}

interface Message {
  id: string;
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
  }>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const params = useParams<{ chatId: string }>();
  const chatId = (params?.chatId as string) || '';
  const { socket } = useChatSocket();
  const onlineUserIds = useChatPresenceStore((state) => state.onlineUserIds);
  const updateLastSeen = useChatPresenceStore((state) => state.updateLastSeen);
  const typingMap = useChatPresenceStore((state) => state.typing);
  const markTyping = useChatPresenceStore((state) => state.markTyping);
  const clearTyping = useChatPresenceStore((state) => state.clearTyping);

  // Блокировка скролла и прокрутка вверх при заходе на страницу (только для мобильных)
  useEffect(() => {
    // Проверяем ширину экрана - блокируем скролл только для экранов менее 640px
    const isMobile = window.innerWidth < 640;

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
  const [error, setError] = useState<string | null>(null);

  // Загрузка информации о чате
  useEffect(() => {
    if (user && chatId) {
      loadChatInfo();
      loadMessages();
    }
  }, [user, chatId]);

  const loadChatInfo = async () => {
    try {
      // Получаем информацию о конкретном чате
      const response = await fetch(`/api/messenger/chats/${chatId}`);
      if (response.ok) {
        const chatData = await response.json();
        setChat(chatData);
        if (chatData.otherUserLastSeenAt) {
          updateLastSeen(chatData.otherUserId, chatData.otherUserLastSeenAt);
        }
      } else if (response.status === 404) {
        setError('Чат не найден');
      } else {
        setError('Ошибка загрузки чата');
      }
    } catch (error) {
      console.error('Error loading chat info:', error);
      setError('Ошибка загрузки чата');
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messenger/chats/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Подключение к сокету и обработка событий
  useEffect(() => {
    if (!socket || !chatId || !user) return;

    socket.emit('join_chat', { chatId });

    const handleNewMessage = (payload: any) => {
      if (payload.chatId !== chatId) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === payload.id);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: payload.id || payload.tempId || `socket-${Date.now()}`,
            content: payload.content,
            senderId: payload.senderId,
            senderName: '',
            timestamp: payload.timestamp || new Date(),
            type: payload.type === 'image' ? 'image' : 'text',
            status: payload.status || 'sent',
            attachments: payload.attachments || [],
          },
        ];
      });

      // Smart scroll: only scroll if user is near bottom
      setTimeout(() => {
        const container = document.querySelector('[data-messages-container]') as HTMLElement;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          if (distanceFromBottom < 100) {
            container.scrollTop = container.scrollHeight;
          }
        }
      }, payload.attachments && payload.attachments.length > 0 ? 200 : 50);
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
                }
              : m
          )
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
      markTyping(chatId, fromUserId, at);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_saved', handleMessageSaved);
    socket.on('typing', handleTyping);

    return () => {
      socket.emit('leave_chat', { chatId });
      socket.off('new_message', handleNewMessage);
      socket.off('message_saved', handleMessageSaved);
      socket.off('typing', handleTyping);
    };
  }, [socket, chatId, user, markTyping]);

  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    tempMessageId?: string
  ) => {
    if (!user) return;

    // Без вложений — отправляем сразу через сокет (сервер сам сохранит)
    if (!attachments || attachments.length === 0) {
      socket?.emit('send_message', { chatId, content, tempId: tempMessageId });
      return;
    }

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
            chatId: data.message.chatId,
            senderId: Number(user.id),
            senderName: user.name,
            content: data.message.content,
            timestamp: data.message.createdAt,
            type:
              data.message.messageType === 'image'
                ? 'image'
                : ('text' as const),
            status: data.message.status as Message['status'],
            attachments: (data.message.attachments || []).map((att: any) => ({
              id: att.id,
              fileUrl: att.fileUrl,
              fileName: att.fileName,
              fileType: att.fileType,
            })),
          }
        : null;

      if (persisted) {
        // Don't add locally - rely on real-time broadcast via socket
        socket?.emit('send_message', {
          chatId,
          tempId: tempMessageId,
          persistedMessage: persisted,
        });
      }

      return { messageId: data.messageId };
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

  const otherUserId = chat?.otherUserId;
  const isOtherUserOnline =
    otherUserId !== undefined && onlineUserIds.has(Number(otherUserId));

  console.log('Chat page onlineUserIds:', Array.from(onlineUserIds));
  console.log('Chat page otherUserId:', otherUserId, 'isOtherUserOnline:', isOtherUserOnline);

  const typingForChat = chatId
    ? typingMap[chatId]?.[otherUserId ?? -1]
    : undefined;
  const isTyping =
    !!typingForChat && Date.now() - typingForChat < 3000 && !!otherUserId;

  // Автоматически очищаем typing состояние через 3 секунды
  useEffect(() => {
    if (!isTyping || !chatId || !otherUserId) return;

    const timeout = setTimeout(() => {
      clearTyping(chatId, otherUserId);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isTyping, chatId, otherUserId, clearTyping]);

  if (!user) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="my-10 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-600"
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
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Ошибка</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link
          href="/personal/messenger"
          className="inline-flex items-center px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
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
        isOtherUserOnline={!!isOtherUserOnline}
        otherUserLastSeen={chat?.otherUserLastSeenAt || null}
        isTyping={isTyping}
        isLoading={isLoading}
        showBackButton={true}
      />
    </div>
  );
}
