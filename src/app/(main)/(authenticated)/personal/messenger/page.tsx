'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import ChatList from '@/components/messenger/chat-list';

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

export default function MessengerPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messenger/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
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
