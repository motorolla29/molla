'use client';

import { useChatPresenceStore } from '@/store/useChatPresenceStore';
import { useOnlineUsersStore } from '@/store/useOnlineUsersStore';
import { useEffect } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface Chat {
  id: string;
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
 

interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chatId: string) => void;
}

export default function ChatList({ chats, onChatSelect }: ChatListProps) {
  const { fetchUsersStatuses, getUserStatus } = useOnlineUsersStore();
  const typingMap = useChatPresenceStore((state) => state.typing);

  // Загружаем статусы пользователей при монтировании
  useEffect(() => {
    const userIds = chats.map(chat => chat.otherUserId);
    if (userIds.length > 0) {
      fetchUsersStatuses(userIds);
    }
  }, [chats, fetchUsersStatuses]);

  const formatTime = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    if (days < 7) return `${days} д`;
    return dateObj.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isUserTyping = (chatId: string, otherUserId: number) => {
    const typingForChat = typingMap[chatId]?.[otherUserId];
    const isTyping = !!typingForChat && Date.now() - typingForChat < 3000;
    if (isTyping) {
      console.log(`[TYPING] isUserTyping: ${chatId}-${otherUserId}-${typingForChat} - TRUE`);
    }
    return isTyping;
  };

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Нет активных чатов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-full overflow-y-auto custom-scrollbar">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatSelect(chat.id)}
          className="p-4 rounded-2xl border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div className="flex max-w-full items-center space-x-4">
            {/* Визуализация товара с аватаром */}
            <div className="relative shrink-0">
              {/* Фото товара */}
              <div className="w-18 h-18 rounded-xl overflow-hidden bg-gray-100">
                {chat.adPhoto ? (
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${chat.adPhoto}?tr=w-150`}
                    alt={chat.adTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Аватар собеседника в левом верхнем углу */}
              <div className="absolute -top-1.5 -left-1.5 w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-white">
                {chat.otherUserAvatar ? (
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${chat.otherUserAvatar}?tr=w-40`}
                    alt={chat.otherUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {chat.otherUserName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Информация о чате */}
            <div className="flex-1 min-w-0 max-w-full flex flex-col justify-center">
              <div className="relative flex items-start justify-between">
                <div className="flex items-center min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {chat.otherUserName}
                  </h3>
                  {/* Онлайн индикатор */}
                  {getUserStatus(chat.otherUserId)?.isOnline && (
                    <div className="shrink-0 w-2 h-2 mx-1 sm:mx-2 bg-emerald-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center shrink-0">
                  {/* Статус последнего сообщения (если исходящее) */}
                  {chat.lastMessageIsOutgoing && chat.lastMessageStatus && (
                    <div className="flex items-center ml-2">
                      {chat.lastMessageStatus === 'sending' && (
                        <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {chat.lastMessageStatus === 'sent' && (
                        <Check className="w-3 h-3 text-gray-500" />
                      )}
                      {chat.lastMessageStatus === 'delivered' && (
                        <Check className="w-3 h-3 text-violet-500" />
                      )}
                      {chat.lastMessageStatus === 'read' && (
                        <CheckCheck className="w-3 h-3 text-violet-500" />
                      )}
                      {chat.lastMessageStatus === 'error' && (
                        <div className="text-xs text-red-500">⚠</div>
                      )}
                    </div>
                  )}
                  <span className="text-xs ml-1 text-gray-500">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                {/* Индикатор непрочитанных сообщений */}
                {chat.unreadCount > 0 && (
                  <div className="absolute right-0 top-6 bg-amber-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-semibold">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </div>
                )}
              </div>

              <p className="mr-8 text-xs text-gray-600 truncate mb-1">
                {chat.adTitle}
                {chat.adPrice && <span className="mx-1">·</span>}
                {chat.adPrice && (
                  <span className="text-xs text-gray-900">{chat.adPrice}</span>
                )}
              </p>

              <div
                className={`mr-8 max-w-fit py-1 px-2 rounded-xl text-sm truncate ${
                  chat.unreadCount > 0
                    ? 'bg-stone-200 text-gray-700 font-semibold'
                    : 'bg-stone-200/40 text-gray-600'
                } ${isUserTyping(chat.id, chat.otherUserId) ? 'bg-transparent' : ''}`}
              >
                {isUserTyping(chat.id, chat.otherUserId) ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
                    <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                    <span className="ml-1 font-semibold text-violet-500">Печатает...</span>
                  </span>
                ) : (
                  chat.lastMessage
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
