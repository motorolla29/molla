'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { lockScrollSimple, unlockScrollSimple } from '@/utils/scroll-lock';
import ChatArea from '@/components/messenger/chat-area';

interface Chat {
  id: string;
  adId: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  type: 'text' | 'image';
  attachments?: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
  }>;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;

  // Блокировка скролла и прокрутка вверх при заходе на страницу
  useEffect(() => {
    lockScrollSimple();
    window.scrollTo(0, 0);

    return () => {
      unlockScrollSimple();
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

  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    tempMessageId?: string
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
      // Возвращаем ID созданного сообщения
      return { messageId: data.messageId };
    } else {
      // При ошибке кидаем исключение
      throw new Error('Failed to send message');
    }
  };

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
        isLoading={isLoading}
        showBackButton={true}
      />
    </div>
  );
}
